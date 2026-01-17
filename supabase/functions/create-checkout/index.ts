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
    
    if (!PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY is not set.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User authentication failed.");

    const { planId } = await req.json();

    // Plan pricing based on your image (in USD cents, then converted)
    const PLAN_PRICES: Record<string, { usd: number, name: string }> = {
      essential: { usd: 9900, name: "Essential" },  // $99
      grow: { usd: 29900, name: "Grow" },          // $299
      premium: { usd: 59900, name: "Premium" },     // $599
    };

    const planConfig = PLAN_PRICES[planId];
    if (!planConfig) throw new Error(`Invalid plan selected: ${planId}`);

    // Convert to GHS Pesewas (1 USD ≈ 11 GHS, 100 pesewas = 1 GHS)
    const usdToGhsRate = 11;
    const amountInGhsPesewas = Math.round((planConfig.usd / 100) * usdToGhsRate * 100);

    // Calculate trial end (7 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInGhsPesewas, 
        currency: "GHS", 
        metadata: { 
          user_id: user.id, 
          planId: planId,
          plan_name: planConfig.name,
          trial_period: true,
          trial_days: 7
        },
        callback_url: `${Deno.env.get("SITE_URL")}/dashboard?payment=success`,
      }),
    });

    const paystackData = await paystackRes.json();
    
    if (!paystackData.status) {
      console.error("Paystack API Error:", paystackData.message);
      throw new Error(paystackData.message || "Paystack initialization error");
    }

    // Update subscription to track trial period
    await supabase
      .from("subscriptions")
      .update({
        status: "trialing",
        trial_start_at: new Date().toISOString(),
        trial_ends_at: trialEndDate.toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ checkout_url: paystackData.data.authorization_url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
