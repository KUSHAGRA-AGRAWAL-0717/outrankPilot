import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Use Service Role to bypass RLS
    );

    const body = await req.json();

    // 1. Check if the event is a successful payment
    if (body.event === "charge.success") {
      const { user_id, planId } = body.data.metadata;
      const reference = body.data.reference;
      const customer_code = body.data.customer.customer_code;

      // 2. Define plan limits based on what was purchased
      const PLAN_LIMITS = {
        pro: { keywords: 200, projects: 5, articles: 50 },
        agency: { keywords: 1000, projects: 20, articles: 300 },
      };

      const limits = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS];

      // 3. Update the subscriptions table
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: planId,
          status: "active",
          paystack_customer_id: customer_code, // Renamed from stripe_customer_id
          paystack_reference: reference,      // Renamed from stripe_subscription_id
          keywords_limit: limits?.keywords || 5,
          projects_limit: limits?.projects || 1,
          articles_limit: limits?.articles || 3,
        })
        .eq("user_id", user_id);

      if (error) throw error;

      // 4. Log the action (Audit Log)
      await supabase.from("audit_logs").insert({
        action: "PAYSTACK_PAYMENT_SUCCESS",
        target_id: user_id,
        payload: { plan: planId, ref: reference }
      });
    }

    return new Response(JSON.stringify({ message: "Webhook processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});