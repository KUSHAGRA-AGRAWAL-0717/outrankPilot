import { useState, useEffect } from "react";
import { Check, Zap, Building2, Sparkles } from "lucide-react";

const BASE_PLANS = [
  {
    id: "essential",
    name: "Essential",
    priceUsd: 99,
    icon: Sparkles,
    popular: false,
    description: "Starter package with AI articles and basic integrations.",
    features: [
      "30 AI articles per month",
      "Unlimited team members",
      "Auto keyword research",
      "WordPress integration",
      "AI content editor",
      "1 WordPress site",
      "AI-generated images",
      "YouTube video integration",
      "150+ languages"
    ],
    limits: { projects: 3, keywords: 500, articles: 30, wpSites: 1 }
  },
  {
    id: "grow",
    name: "Grow",
    priceUsd: 299,
    icon: Zap,
    popular: true,
    description: "Everything in Essential plus backlinks and auto-publishing.",
    features: [
      "Everything in Essential",
      "60 AI articles per month",
      "High DR backlinks",
      "3 WordPress sites",
      "Daily auto-publishing",
      "Backlink Exchange"
    ],
    limits: { projects: 10, keywords: 2000, articles: 60, wpSites: 3 }
  },
  {
    id: "premium",
    name: "Premium",
    priceUsd: 599,
    icon: Building2,
    popular: false,
    description: "Unlimited publishing with advanced integrations.",
    features: [
      "Everything in Grow",
      "Unlimited AI articles",
      "Ghost, Webflow, Notion, Wix, Shopify integrations",
      "Webhook support",
      "Priority feature requests",
      "Unlimited WordPress sites"
    ],
    limits: { projects: 9999, keywords: 999999, articles: -1, wpSites: -1 }
  }
];

export default function PlanMatrix() {
  const [loading, setLoading] = useState(null);
  const [currency, setCurrency] = useState({ code: "USD", rate: 1 });

  useEffect(() => {
    const locale = navigator.language || "en-US";

    if (locale.includes("en-IN") || locale.includes("hi-IN")) {
      setCurrency({ code: "INR", rate: 83 });
    } else if (locale.includes("en-GH") || locale.includes("ak-GH")) {
      setCurrency({ code: "GHS", rate: 11 });
    } else {
      setCurrency({ code: "USD", rate: 1 });
    }
  }, []);

  const formatPrice = (priceUsd) => {
    if (priceUsd === 0) return "Free";
    const converted = Number(priceUsd) * Number(currency.rate || 1);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.code,
        maximumFractionDigits: 0
      }).format(converted);
    } catch {
      return `${currency.code} ${converted.toFixed(0)}`;
    }
  };

  const subscribe = async (planId) => {
    setLoading(planId);
    // Simulate checkout process
    setTimeout(() => {
      alert(`Redirecting to checkout for ${planId} plan...`);
      setLoading(null);
    }, 1500);
  };

  return (
    <div className="py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-600">Choose the plan that fits your growth</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {BASE_PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 bg-white ${
                plan.popular
                  ? "border-2 border-blue-500 ring-4 ring-blue-100 shadow-2xl scale-105 z-10"
                  : "border border-slate-200 hover:border-blue-300 hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    plan.popular ? "bg-blue-600" : "bg-slate-800"
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-slate-900">{formatPrice(plan.priceUsd)}</span>
                  <span className="text-slate-600 font-medium">/month</span>
                </div>
                <p className="text-sm text-slate-500">Pay as you go · Cancel anytime</p>
              </div>

              <div className="flex-grow space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={loading !== null}
                onClick={() => subscribe(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-black hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1"
                    : "bg-slate-900 text-black hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-1"
                } ${loading !== null ? "opacity-50 cursor-not-allowed" : ""} disabled:hover:transform-none`}
              >
                {loading === plan.id ? "Redirecting..." : `Get Started`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-16">
        <p className="text-slate-600 text-lg">
          No contracts · No hidden fees · 100% transparent
        </p>
      </div>
    </div>
  );
}