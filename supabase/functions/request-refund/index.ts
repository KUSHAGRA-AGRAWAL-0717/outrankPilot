import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User authentication failed.");

    const { reason, bankName, accountNumber, accountName } = await req.json();

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("No subscription found. Please ensure you have an active subscription.");
    }

    // Check subscription status
    if (!["active", "trialing"].includes(subscription.status)) {
      throw new Error("Your subscription is not active. Refunds are only available for active subscriptions.");
    }

    // Check if payment reference exists
    if (!subscription.paystack_reference) {
      throw new Error("No payment record found for this subscription.");
    }

    // Check if within 7-day period from subscription start or trial start
    const startDate = subscription.subscription_start_at || subscription.trial_start_at;
    if (!startDate) {
      throw new Error("Cannot determine subscription start date.");
    }

    const daysSinceStart = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart > 7) {
      throw new Error(`Refund period has expired. You subscribed ${daysSinceStart} days ago. Refunds are only available within 7 days of subscription.`);
    }

    // Check if refund request already exists for THIS payment reference
    const { data: existingRefund } = await supabase
      .from("refunds")
      .select("*")
      .eq("paystack_reference", subscription.paystack_reference)
      .single();

    if (existingRefund) {
      const statusMessages = {
        pending: "Your refund request is pending review. Please wait for admin approval.",
        processing: "Your refund is currently being processed.",
        success: "A refund has already been processed for this payment.",
        failed: "Your previous refund request was rejected. Please contact support for more information."
      };
      
      throw new Error(
        statusMessages[existingRefund.status as keyof typeof statusMessages] || 
        "A refund request already exists for this payment."
      );
    }

    // Get transaction details from Paystack to get the amount
    let transactionAmount = 0;
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${subscription.paystack_reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const verifyData = await verifyRes.json();
    
    if (verifyData.status && verifyData.data) {
      transactionAmount = verifyData.data.amount; // Amount in pesewas
    } else {
      console.error("Failed to verify transaction:", verifyData);
      throw new Error("Unable to verify payment details. Please contact support.");
    }

    // Create refund request (always manual approval)
    const { data: refundRecord, error: refundError } = await supabase
      .from("refunds")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        paystack_reference: subscription.paystack_reference,
        amount: transactionAmount,
        reason: reason,
        status: "pending",
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      })
      .select()
      .single();

    if (refundError) {
      console.error("Error creating refund:", refundError);
      throw new Error("Failed to create refund request. Please try again.");
    }

    // Mark subscription for cancellation (don't cancel immediately)
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("user_id", user.id);

    // Log the action
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "REFUND_REQUESTED",
      target_id: user.id,
      meta: {
        refund_id: refundRecord.id,
        subscription_id: subscription.id,
        paystack_reference: subscription.paystack_reference,
        amount: transactionAmount,
        reason: reason
      }
    });

    return new Response(JSON.stringify({ 
      message: "Refund request submitted. Our team will review and process it within 5-7 business days.",
      refund_id: refundRecord.id,
      amount: transactionAmount / 100, // Convert to cedis
      manual_refund: true,
      days_remaining: 7 - daysSinceStart
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Refund request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
