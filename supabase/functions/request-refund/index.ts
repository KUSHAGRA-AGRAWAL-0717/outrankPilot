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

    if (subError || !subscription) throw new Error("No active subscription found.");

    // Check if within 7-day trial period
    const trialStart = new Date(subscription.trial_start_at);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart > 7) {
      throw new Error("Refund period has expired. Refunds are only available within 7 days of subscription.");
    }

    // Initiate Paystack refund
    const paystackRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: subscription.paystack_reference,
        merchant_note: `Refund requested within trial period: ${reason}`,
      }),
    });

    const refundData = await paystackRes.json();
    
    if (!refundData.status) {
      // If Paystack doesn't support automatic refund, create manual refund request
      const { data: refundRecord } = await supabase
        .from("refunds")
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          paystack_reference: subscription.paystack_reference,
          amount: refundData.data?.amount || 0,
          reason: reason,
          status: "pending",
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        })
        .select()
        .single();

      // Cancel subscription
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
        })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ 
        message: "Refund request submitted. Our team will process it within 5-7 business days.",
        refund_id: refundRecord.id,
        manual_refund: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Automatic refund successful
    await supabase.from("refunds").insert({
      user_id: user.id,
      subscription_id: subscription.id,
      paystack_reference: subscription.paystack_reference,
      amount: refundData.data.amount,
      reason: reason,
      status: "success",
      processed_at: new Date().toISOString(),
    });

    // Cancel subscription
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ 
      message: "Refund processed successfully",
      refund: refundData.data
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
