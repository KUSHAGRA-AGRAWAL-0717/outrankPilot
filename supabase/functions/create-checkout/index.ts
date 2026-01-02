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

    // Your base prices in GHS Pesewas (100 Pesewas = 1 GHS)
    const BASE_PRICES_GHS: Record<string, number> = {
      pro: 15000,    // 150 GHS
      agency: 45000, // 450 GHS
    };

    const amountInGHS = BASE_PRICES_GHS[planId];
    if (!amountInGHS) throw new Error(`Invalid plan selected: ${planId}`);

    // FORCE GHS to avoid "currency not served by merchant" error
    const finalAmount = amountInGHS;
    const finalCurrency = "GHS"; 

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: finalAmount, 
        currency: finalCurrency, 
        metadata: { 
          user_id: user.id, 
          planId: planId 
        },
        // Optional: you can add a callback_url here to redirect users back to your site
        // callback_url: "https://your-site.com/dashboard"
      }),
    });

    const paystackData = await paystackRes.json();
    
    if (!paystackData.status) {
      // Log the specific error from Paystack for debugging
      console.error("Paystack API Error:", paystackData.message);
      throw new Error(paystackData.message || "Paystack initialization error");
    }

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