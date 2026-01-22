import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* ---------------- ENV VALIDATION ---------------- */
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing server configuration");
    }

    /* ---------------- SUPABASE CLIENT ---------------- */
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* ---------------- REQUEST BODY ---------------- */
    const { planId, billingCycle = "monthly" } = await req.json();

    if (!planId) {
      throw new Error("planId is required");
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      throw new Error("Invalid billing cycle");
    }

    /* ---------------- PLAN CONFIG ---------------- */
     const PLAN_CONFIG: Record<
      string,
      {
        monthly: { amount: number; code: string };
        yearly: { amount: number; code: string };
      }
    > = {
      essential: {
        monthly: {
          amount: 107365, // GHS 1,073.65 in pesewas
          code: "PLN_w35h4qceanizs7c",
        },
        yearly: {
          amount: 1071235, // GHS 10,712.35 in pesewas
          code: "PLN_vbkl07jghtwr1o6",
        },
      },
      grow: {
        monthly: {
          amount: 324266, // GHS 3,242.66 in pesewas
          code: "PLN_hju9o2rw60qruqo",
        },
        yearly: {
          amount: 3235346, // GHS 32,353.46 in pesewas
          code: "PLN_78jzbym87kowh9g",
        },
      },
      premium: {
        monthly: {
          amount: 649616, // GHS 6,496.16 in pesewas
          code: "PLN_lzzzgq3o96n8o3i",
        },
        yearly: {
          amount: 6481512, // GHS 64,815.12 in pesewas
          code: "PLN_ffbacw6ytwkuxe4",
        },
      },
      // essential: {
      //   monthly: {
      //     amount: 107365, // GHS 1,073.65 in pesewas
      //     code: "PLN_87nwcnouil1i98h",
      //   },
      //   yearly: {
      //     amount: 1071235, // GHS 10,712.35 in pesewas
      //     code: "PLN_c2s6d1nvy0oyfji",
      //   },
      // },
      // grow: {
      //   monthly: {
      //     amount: 324266, // GHS 3,242.66 in pesewas
      //     code: "PLN_0aevo2c44755kwj",
      //   },
      //   yearly: {
      //     amount: 3235346, // GHS 32,353.46 in pesewas
      //     code: "PLN_mt5wghckhw3t7sr",
      //   },
      // },
      // premium: {
      //   monthly: {
      //     amount: 649616, // GHS 6,496.16 in pesewas
      //     code: "PLN_9kxpucmy2fz6zx6",
      //   },
      //   yearly: {
      //     amount: 6481512, // GHS 64,815.12 in pesewas
      //     code: "PLN_jnq0k839x2jc08d",
      //   },
      // },
    };


    if (!PLAN_CONFIG[planId]) {
      throw new Error("Invalid plan selected");
    }

    const planDetails = PLAN_CONFIG[planId][
      billingCycle as "monthly" | "yearly"
    ];

    if (!planDetails) {
      throw new Error("Plan configuration missing");
    }

    /* ---------------- EXISTING SUB CHECK ---------------- */
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      existingSub &&
      ["active", "trialing"].includes(existingSub.status)
    ) {
      if (existingSub.plan === planId) {
        throw new Error("Already subscribed to this plan");
      }
    }

    /* ---------------- PAYSTACK PAYLOAD ---------------- */
    const paystackPayload = {
      email: user.email,
      amount: planDetails.amount,
      currency: "GHS",
      plan: planDetails.code,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
      callback_url: `${
        Deno.env.get("SITE_URL") ?? "http://localhost:8080"
      }/dashboard?payment=success`,
    };

    /* ---------------- PAYSTACK INIT ---------------- */
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    );

    if (!paystackRes.ok) {
      throw new Error("Paystack initialization failed");
    }

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Payment failed");
    }

    /* ---------------- AUDIT LOG ---------------- */
    await supabase.from("audit_logs").insert({
      action: "CHECKOUT_INITIATED",
      target_id: user.id,
      meta: {
        plan: planId,
        billing_cycle: billingCycle,
        amount: planDetails.amount,
        reference: paystackData.data.reference,
      },
    });

    /* ---------------- RESPONSE ---------------- */
    return new Response(
      JSON.stringify({
        checkout_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
