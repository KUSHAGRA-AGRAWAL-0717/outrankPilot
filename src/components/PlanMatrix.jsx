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

      if (error) {
        console.error("Invoke Error:", error);
        alert(`System Error: ${error.message}`);
        return;
      }

      if (data?.error) {
        console.error("Logic Error:", data.error);
        alert(`Payment Error: ${data.error}`);
        return;
      }

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
    <div className="py-24 px-6 bg-[#F6F8FC] min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-[#0B1F3B] mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-[#5B6B8A]">Choose the plan that fits your growth.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {BASE_PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 bg-white ${
                plan.popular 
                ? "border-[#1B64F2] ring-2 ring-[#1B64F2] shadow-xl scale-105 z-10" 
                : "border-[#8A94B3]/30 hover:border-[#1B64F2]/50 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#FFD84D] text-[#0B1F3B] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </span>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A1E5C]">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0B1F3B]">{plan.name}</h3>
                </div>
                <p className="text-sm text-[#5B6B8A] leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[#0B1F3B]">{formatPrice(plan.ghsPrice)}</span>
                  {plan.ghsPrice > 0 && <span className="text-[#5B6B8A] font-medium">/mo</span>}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#5B6B8A]">
                    <Check className="h-5 w-5 text-[#3EF0C1] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={loading !== null || plan.id === "free"}
                onClick={() => subscribe(plan.id)}
                className={`w-full py-3 px-6 rounded-full font-semibold text-base transition-all ${
                  plan.popular 
                  ? "bg-[#FFD84D] text-[#0B1F3B] hover:bg-[#F5C842] shadow-md hover:shadow-lg hover:-translate-y-0.5" 
                  : "bg-transparent border-2 border-[#1B64F2] text-[#1B64F2] hover:bg-[#1B64F2] hover:text-white"
                } ${(loading !== null || plan.id === "free") ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading === plan.id ? (
                  "Initializing..."
                ) : plan.id === "free" ? (
                  "Active Plan"
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-[#5B6B8A]">
          All plans include a 7-day free trial. Cancel anytime, no questions asked.
        </p>
      </div>
    </div>
  );
}