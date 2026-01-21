import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const signature = req.headers.get("x-paystack-signature");

    const body = await req.text();
    console.log("Webhook received:", body);

    // Verify webhook signature
    if (signature && PAYSTACK_SECRET_KEY) {
      const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(body)
        .digest();
      const expectedSignature = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature !== expectedSignature) {
        console.error("Invalid signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Event type:", event.event);
    console.log("Event data:", JSON.stringify(event.data, null, 2));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Handle successful payment
    if (event.event === "charge.success") {
      const { reference, customer, amount, metadata, plan } = event.data;
      
      console.log("Processing charge.success:", {
        reference,
        metadata,
        plan,
      });

      const userId = metadata?.user_id || metadata?.custom_fields?.find(
        (f: any) => f.variable_name === "user_id"
      )?.value;
      
      const planId = metadata?.planId || metadata?.plan || metadata?.custom_fields?.find(
        (f: any) => f.variable_name === "plan"
      )?.value;

      if (!userId) {
        console.error("No user_id in metadata:", metadata);
        throw new Error("Missing user_id in metadata");
      }

      if (!planId) {
        console.error("No planId in metadata:", metadata);
        throw new Error("Missing planId in metadata");
      }

      console.log("Extracted:", { userId, planId });

      // Plan limits mapping
      const PLAN_LIMITS: Record<string, any> = {
        essential: {
          keywords_limit: 500,
          projects_limit: 3,
          articles_limit: 30,
          auto_publish: false,
          ai_images: true,
          languages_limit: 150,
        },
        grow: {
          keywords_limit: 2000,
          projects_limit: 10,
          articles_limit: 60,
          auto_publish: true,
          ai_images: true,
          languages_limit: 150,
        },
        premium: {
          keywords_limit: 999999,
          projects_limit: 9999,
          articles_limit: -1,
          auto_publish: true,
          ai_images: true,
          languages_limit: 150,
        },
      };

      const limits = PLAN_LIMITS[planId];
      if (!limits) {
        console.error("Invalid plan:", planId);
        throw new Error(`Invalid plan: ${planId}`);
      }

      // Calculate trial dates
      const now = new Date();
      const trialStart = now.toISOString();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan: planId,
            status: "trialing",
            trial_start_at: trialStart,
            trial_ends_at: trialEnd,
            subscription_start_at: trialStart,
            paystack_reference: reference,
            paystack_customer_id: customer?.customer_code || customer?.id || null,
            paystack_subscription_code: plan?.subscription_code || null,
            ...limits,
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Subscription update error:", updateError);
          throw updateError;
        }

        console.log("Subscription updated for user:", userId);
      } else {
        // Insert new subscription
        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan: planId,
            status: "trialing",
            trial_start_at: trialStart,
            trial_ends_at: trialEnd,
            subscription_start_at: trialStart,
            paystack_reference: reference,
            paystack_customer_id: customer?.customer_code || customer?.id || null,
            paystack_subscription_code: plan?.subscription_code || null,
            ...limits,
          });

        if (insertError) {
          console.error("Subscription insert error:", insertError);
          throw insertError;
        }

        console.log("Subscription created for user:", userId);
      }

      // Log the payment
      await supabase.from("audit_logs").insert({
        action: "PAYSTACK_PAYMENT_SUCCESS",
        target_id: userId,
        meta: {
          ref: reference,
          plan: planId,
          amount: amount,
        },
      });

      return new Response(
        JSON.stringify({ message: "Webhook processed successfully" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle subscription creation
    if (event.event === "subscription.create") {
      const { subscription_code, customer, plan } = event.data;
      console.log("Subscription created:", subscription_code);

      // Update subscription with subscription code
      const { error } = await supabase
        .from("subscriptions")
        .update({
          paystack_subscription_code: subscription_code,
          status: "active",
        })
        .eq("paystack_customer_id", customer.customer_code);

      if (error) {
        console.error("Error updating subscription code:", error);
      }
    }

    return new Response(
      JSON.stringify({ message: "Event received" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Webhook error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200, // Return 200 to prevent Paystack retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
