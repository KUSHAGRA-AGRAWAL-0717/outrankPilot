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
    
    // Use service role key with Authorization header for admin verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Authentication failed");
    }

    console.log("User authenticated:", user.id);

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      throw new Error("User profile not found");
    }

    if (profile.role !== "admin") {
      console.error("User is not admin. Role:", profile.role);
      throw new Error("Unauthorized: Admin access required");
    }

    console.log("Admin verified, proceeding with refund");

    const { refundId, action } = await req.json();
    console.log("Processing refund:", { refundId, action });

    // Get refund details
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .select("*")
      .eq("id", refundId)
      .single();

    if (refundError || !refund) {
      console.error("Refund not found:", refundError);
      throw new Error("Refund not found");
    }

    console.log("Refund details:", {
      id: refund.id,
      reference: refund.paystack_reference,
      amount: refund.amount,
      status: refund.status
    });

    if (action === 'reject') {
      // Update status to failed
      const { error: updateError } = await supabase
        .from("refunds")
        .update({
          status: "failed",
          processed_at: new Date().toISOString()
        })
        .eq("id", refundId);

      if (updateError) {
        console.error("Error updating refund:", updateError);
        throw updateError;
      }

      // Log the rejection
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "REFUND_REJECTED",
        target_id: refund.user_id,
        meta: {
          refund_id: refundId,
          reason: refund.reason
        }
      });

      console.log("Refund rejected successfully");

      return new Response(JSON.stringify({ 
        message: "Refund rejected successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If approving, initiate Paystack refund
    console.log("Initiating Paystack refund for:", refund.paystack_reference);
    
    const paystackPayload = {
      transaction: refund.paystack_reference,
      amount: refund.amount, // Amount in pesewas
      merchant_note: `Refund approved: ${refund.reason || 'Customer request'}`,
    };

    console.log("Paystack refund payload:", paystackPayload);

    const paystackRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const refundData = await paystackRes.json();
    console.log("Paystack refund response:", refundData);
    
    if (!refundData.status) {
      console.error("Paystack refund failed:", refundData);
      
      // If Paystack API fails, mark as processing for manual handling
      await supabase
        .from("refunds")
        .update({
          status: "processing"
        })
        .eq("id", refundId);

      // Log the issue for manual processing
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "REFUND_MANUAL_REQUIRED",
        target_id: refund.user_id,
        meta: {
          refund_id: refundId,
          error: refundData.message,
          paystack_error: refundData,
          bank_details: {
            bank_name: refund.bank_name,
            account_number: refund.account_number,
            account_name: refund.account_name,
            amount_ghs: (refund.amount / 100).toFixed(2)
          }
        }
      });

      throw new Error(
        `Paystack automatic refund failed: ${refundData.message}. ` +
        `Status changed to "processing" for manual handling. ` +
        `Use bank details: ${refund.bank_name} - ${refund.account_number} (${refund.account_name})`
      );
    }

    // Paystack refund successful - update database
    console.log("Paystack refund successful, updating database");

    const { error: updateError } = await supabase
      .from("refunds")
      .update({
        status: "success",
        processed_at: new Date().toISOString()
      })
      .eq("id", refundId);

    if (updateError) {
      console.error("Error updating refund status:", updateError);
      throw updateError;
    }

    // Cancel the subscription
    const { error: cancelError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false
      })
      .eq("id", refund.subscription_id);

    if (cancelError) {
      console.error("Error canceling subscription:", cancelError);
      // Don't throw - refund is successful even if subscription update fails
    }

    // Log the successful processing
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "REFUND_PROCESSED",
      target_id: refund.user_id,
      meta: {
        refund_id: refundId,
        paystack_response: refundData.data,
        amount: refund.amount,
        amount_ghs: (refund.amount / 100).toFixed(2)
      }
    });

    console.log("Refund processed successfully");

    return new Response(JSON.stringify({ 
      message: "Refund processed successfully. Amount will be refunded to customer's original payment method within 5-7 business days.",
      refund: refundData.data,
      amount_refunded: `GHS ${(refund.amount / 100).toFixed(2)}`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Process refund error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Unauthorized") ? 401 : 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
