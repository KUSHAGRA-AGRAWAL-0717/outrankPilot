import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const signature = req.headers.get("x-paystack-signature");
    
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    // Verify webhook signature
    const hash = createHmac("sha512", PAYSTACK_SECRET_KEY!)
      .update(bodyText)
      .digest("hex");
    
    if (hash !== signature) {
      throw new Error("Invalid webhook signature");
    }

    // Handle successful payment
    if (body.event === "charge.success") {
      const { user_id, planId, trial_period } = body.data.metadata;
      const reference = body.data.reference;
      const customer_code = body.data.customer.customer_code;
      const authorization_code = body.data.authorization.authorization_code;

      // Define plan limits based on your image
      const PLAN_LIMITS = {
        essential: { 
          keywords: 500, 
          projects: 3, 
          articles: 30, 
          wpSites: 1,
          autoPublish: false,
          aiImages: true,
          languagesLimit: 150
        },
        grow: { 
          keywords: 2000, 
          projects: 10, 
          articles: 60, 
          wpSites: 3,
          autoPublish: true,
          aiImages: true,
          languagesLimit: 150
        },
        premium: { 
          keywords: 999999, 
          projects: 9999, 
          articles: -1, 
          wpSites: -1,
          autoPublish: true,
          aiImages: true,
          languagesLimit: 150
        },
      };

      const limits = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS];

      const now = new Date();
      const subscriptionEnd = new Date(now);
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      // Update subscription
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: planId,
          status: "active",
          paystack_customer_id: customer_code,
          paystack_reference: reference,
          subscription_start_at: now.toISOString(),
          subscription_end_at: subscriptionEnd.toISOString(),
          keywords_limit: limits?.keywords || 5,
          projects_limit: limits?.projects || 1,
          articles_limit: limits?.articles || 3,
          auto_publish: limits?.autoPublish || false,
          ai_images: limits?.aiImages || false,
          languages_limit: limits?.languagesLimit || 1,
        })
        .eq("user_id", user_id);

      if (error) throw error;

      // Create Paystack subscription for recurring billing if trial ended
      if (!trial_period) {
        // You'll need to create a plan on Paystack dashboard first
        // Then use the plan code here
        const planCode = `PLN_${planId}`; // Replace with actual Paystack plan codes
        
        await fetch("https://api.paystack.co/subscription", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customer_code,
            plan: planCode,
            authorization: authorization_code,
          }),
        });
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        action: "PAYSTACK_PAYMENT_SUCCESS",
        target_id: user_id,
        payload: { plan: planId, ref: reference, trial: trial_period }
      });
    }

    // Handle subscription cancellation
    if (body.event === "subscription.disable") {
      const customer_code = body.data.customer.customer_code;
      
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          subscription_end_at: new Date().toISOString(),
        })
        .eq("paystack_customer_id", customer_code);
    }

    return new Response(JSON.stringify({ message: "Webhook processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
