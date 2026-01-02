import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  );

  if (event.type === "checkout.session.completed") {
    const session: any = event.data.object;

    const plan = session.metadata.plan;

    const LIMITS = {
      pro: { projects: 5, keywords: 200, articles: 50 },
      agency: { projects: 20, keywords: 1000, articles: 300 },
    };
    const PLAN_CAPS = {
  pro: {
    auto_publish: true,
    ai_images: false,
    languages_limit: 5,
  },
  agency: {
    auto_publish: true,
    ai_images: true,
    languages_limit: 150,
  },
};

    await supabase.from("subscriptions").upsert({
  user_id: session.metadata.user_id,
  stripe_customer_id: session.customer,
  stripe_subscription_id: session.subscription,
  plan,
  status: "active",
  projects_limit: LIMITS[plan].projects,
  keywords_limit: LIMITS[plan].keywords,
  articles_limit: LIMITS[plan].articles,
  auto_publish: PLAN_CAPS[plan].auto_publish,
  ai_images: PLAN_CAPS[plan].ai_images,
  languages_limit: PLAN_CAPS[plan].languages_limit,
});
  }

  return new Response("OK", { status: 200,headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
