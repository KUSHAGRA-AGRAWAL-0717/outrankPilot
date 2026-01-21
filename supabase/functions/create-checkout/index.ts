import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      throw new Error("Payment configuration error");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("User authentication failed.");
    }

    const { planId, billingCycle = "monthly" } = await req.json();
    console.log("Received request:", { planId, billingCycle, userId: user.id });

    // Plan configurations with amounts and codes
    const PLAN_CONFIG: Record<
      string,
      {
        monthly: { amount: number; code: string };
        yearly: { amount: number; code: string };
      }
    > = {
      // essential: {
      //   monthly: {
      //     amount: 107365, // GHS 1,073.65 in pesewas
      //     code: "PLN_w35h4qceanizs7c",
      //   },
      //   yearly: {
      //     amount: 1071235, // GHS 10,712.35 in pesewas
      //     code: "PLN_vbkl07jghtwr1o6",
      //   },
      // },
      // grow: {
      //   monthly: {
      //     amount: 324266, // GHS 3,242.66 in pesewas
      //     code: "PLN_hju9o2rw60qruqo",
      //   },
      //   yearly: {
      //     amount: 3235346, // GHS 32,353.46 in pesewas
      //     code: "PLN_78jzbym87kowh9g",
      //   },
      // },
      // premium: {
      //   monthly: {
      //     amount: 649616, // GHS 6,496.16 in pesewas
      //     code: "PLN_lzzzgq3o96n8o3i",
      //   },
      //   yearly: {
      //     amount: 6481512, // GHS 64,815.12 in pesewas
      //     code: "PLN_ffbacw6ytwkuxe4",
      //   },
      // },
      essential: {
        monthly: {
          amount: 107365, // GHS 1,073.65 in pesewas
          code: "PLN_87nwcnouil1i98h",
        },
        yearly: {
          amount: 1071235, // GHS 10,712.35 in pesewas
          code: "PLN_c2s6d1nvy0oyfji",
        },
      },
      grow: {
        monthly: {
          amount: 324266, // GHS 3,242.66 in pesewas
          code: "PLN_0aevo2c44755kwj",
        },
        yearly: {
          amount: 3235346, // GHS 32,353.46 in pesewas
          code: "PLN_mt5wghckhw3t7sr",
        },
      },
      premium: {
        monthly: {
          amount: 649616, // GHS 6,496.16 in pesewas
          code: "PLN_9kxpucmy2fz6zx6",
        },
        yearly: {
          amount: 6481512, // GHS 64,815.12 in pesewas
          code: "PLN_jnq0k839x2jc08d",
        },
      },
    };

    if (!PLAN_CONFIG[planId]) {
      console.error("Invalid plan ID:", planId);
      throw new Error(`Invalid plan: ${planId}. Please select a valid plan.`);
    }

    const planDetails =
      PLAN_CONFIG[planId][billingCycle as "monthly" | "yearly"];
    console.log("Plan details:", planDetails);

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (
      existingSub &&
      (existingSub.status === "active" || existingSub.status === "trialing")
    ) {
      console.log("User already has active subscription:", existingSub.plan);

      // If trying to subscribe to the same plan, return error
      if (existingSub.plan === planId && existingSub.status === "active") {
        throw new Error("You are already subscribed to this plan.");
      }
    }

    // Prepare Paystack payload with both amount AND plan
    const paystackPayload = {
      email: user.email,
      amount: planDetails.amount, // Amount in pesewas (required)
      currency: "GHS",
      plan: planDetails.code, // Plan code (for subscription)
      metadata: {
        user_id: user.id,
        planId: planId,
        billing_cycle: billingCycle,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id,
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: planId,
          },
        ],
      },
      callback_url: `${Deno.env.get("SITE_URL") || "http://localhost:8080"}/dashboard?payment=success`,
    };

    console.log(
      "Paystack payload:",
      JSON.stringify(paystackPayload, null, 2),
    );

    // Initialize Paystack transaction
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      },
    );

    const paystackData = await paystackRes.json();
    console.log("Paystack response:", JSON.stringify(paystackData, null, 2));

    if (!paystackData.status) {
      console.error("Paystack API Error:", paystackData);
      throw new Error(
        paystackData.message ||
          "Payment initialization failed. Please try again.",
      );
    }

    // DO NOT update subscription here - let the webhook handle it after payment
    // Only log the checkout initiation
    await supabase.from("audit_logs").insert({
      action: "CHECKOUT_INITIATED",
      target_id: user.id,
      meta: {
        plan: planId,
        billing_cycle: billingCycle,
        plan_code: planDetails.code,
        amount: planDetails.amount,
        reference: paystackData.data.reference,
      },
    });

    console.log("Checkout created successfully:", paystackData.data.reference);

    return new Response(
      JSON.stringify({
        checkout_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Create checkout error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
