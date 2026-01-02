import { useState, useEffect } from "react";
import { Check, Zap, Building2, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BASE_PLANS = [
  { 
    id: "free", 
    name: "Free", 
    ghsPrice: 0, 
    icon: Sparkles, 
    popular: false, 
    description: "Ideal for beginners testing the waters.",
    features: ["1 Active Project", "5 Target Keywords", "3 AI Articles /mo", "Basic SEO Tools"],
    limits: { projects: 1, keywords: 5, articles: 3 } 
  },
  { 
    id: "pro", 
    name: "Pro", 
    ghsPrice: 150, 
    icon: Zap, 
    popular: true, 
    description: "Best for professional bloggers & small teams.",
    features: ["5 Active Projects", "200 Target Keywords", "50 AI Articles /mo", "Priority Support", "Advanced AI Models"],
    limits: { projects: 5, keywords: 200, articles: 50 } 
  },
  { 
    id: "agency", 
    name: "Agency", 
    ghsPrice: 450, 
    icon: Building2, 
    popular: false, 
    description: "Scaling power for content marketing agencies.",
    features: ["20 Active Projects", "1000 Target Keywords", "300 AI Articles /mo", "White-label Reports", "API Access"],
    limits: { projects: 20, keywords: 1000, articles: 300 } 
  },
];

export default function PlanMatrix() {
  const [loading, setLoading] = useState(null);
  const [currency, setCurrency] = useState({ code: "GHS", symbol: "GH₵", rate: 1 });

  useEffect(() => {
    // Basic auto-detection logic
    const locale = navigator.language;
    if (locale.includes("en-US")) setCurrency({ code: "USD", symbol: "$", rate: 0.065 });
    else if (locale.includes("en-IN")) setCurrency({ code: "INR", symbol: "₹", rate: 5.40 });
  }, []);

  const formatPrice = (ghsPrice) => {
    if (ghsPrice === 0) return "Free";
    const converted = (ghsPrice * currency.rate).toFixed(2);
    return `${currency.symbol}${converted}`;
  };

  const subscribe = async (planId) => {
  if (planId === "free") return;
  setLoading(planId);
  
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { planId: planId, currency: currency.code },
    });

    // 1. Check for Supabase Invocation errors (like network/404)
    if (error) {
      console.error("Invoke Error:", error);
      alert(`System Error: ${error.message}`);
      return;
    }

    // 2. Check for Logic errors returned from your Edge Function
    if (data?.error) {
      console.error("Logic Error:", data.error);
      alert(`Payment Error: ${data.error}`);
      return;
    }

    // 3. Success Redirect
    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert("No checkout URL received.");
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    alert("An unexpected error occurred.");
  } finally {
    setLoading(null);
  }
};

  return (
    <div className="py-12 px-4 bg-black min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-400">Choose the plan that fits your growth.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {BASE_PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                plan.popular 
                ? "bg-gray-900 border-primary ring-2 ring-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-105 z-10" 
                : "bg-gray-950 border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Icon size={24} />
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{formatPrice(plan.ghsPrice)}</span>
                  {plan.ghsPrice > 0 && <span className="text-gray-500 font-medium">/mo</span>}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                disabled={loading !== null || plan.id === "free"}
                onClick={() => subscribe(plan.id)}
                className="w-full h-12 text-md font-semibold"
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.id ? (
                  "Initializing..."
                ) : plan.id === "free" ? (
                  "Active Plan"
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}