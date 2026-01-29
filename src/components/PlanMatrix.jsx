// import { useState, useEffect } from "react";
// import {
//   Check,
//   Zap,
//   Building2,
//   Sparkles,
//   AlertCircle,
//   Star,
//   ArrowRight,
//   Shield,
// } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";

// const BASE_PLANS = [
//   {
//     id: "essential",
//     name: "Essential",
//     priceUsd: 99,
//     icon: Sparkles,
//     popular: false,
//     badge: "Starter",
//     description:
//       "Perfect for individuals and small teams getting started with AI content.",
//     features: [
//       "30 AI articles per month",
//       "Unlimited team members",
//       "Auto keyword research",
//       "WordPress integration",
//       "AI content editor",
//       "1 WordPress site",
//       "AI-generated images",
//       "150+ languages",
//       "Email support",
//     ],
//     limits: {
//       projects: 3,
//       keywords: 500,
//       articles: 30,
//       wpSites: 1,
//       autoPublish: false,
//       aiImages: true,
//       languagesLimit: 150,
//     },
//   },
//   {
//     id: "grow",
//     name: "Grow",
//     priceUsd: 299,
//     icon: Zap,
//     popular: true,
//     badge: "Most Popular",
//     description:
//       "Ideal for growing businesses that need more content and advanced features.",
//     features: [
//       "Everything in Essential",
//       "60 AI articles per month",
//       "3 WordPress sites",
//       "Daily auto-publishing",
//       "Priority support",
//       "Advanced analytics",
//       "Custom branding",
//       "API access",
//     ],
//     limits: {
//       projects: 10,
//       keywords: 2000,
//       articles: 60,
//       wpSites: 3,
//       autoPublish: true,
//       aiImages: true,
//       languagesLimit: 150,
//     },
//   },
//   {
//     id: "premium",
//     name: "Premium",
//     priceUsd: 599,
//     icon: Building2,
//     popular: false,
//     badge: "Enterprise",
//     description:
//       "For agencies and enterprises requiring unlimited content and integrations.",
//     features: [
//       "Everything in Grow",
//       "Unlimited AI articles",
//       "Notion integration",
//       "WordPress integration",
//       "Priority feature requests",
//       "Unlimited WordPress sites",
//       "Dedicated account manager",
//       "Custom integrations",
//     ],
//     limits: {
//       projects: 9999,
//       keywords: 999999,
//       articles: -1,
//       wpSites: -1,
//       autoPublish: true,
//       aiImages: true,
//       languagesLimit: 150,
//     },
//   },
// ];

// export default function PlanMatrix() {
//   const [loading, setLoading] = useState(null);
//   const [user, setUser] = useState(null);
//   const [currentSubscription, setCurrentSubscription] = useState(null);
//   const [error, setError] = useState(null);
//   const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" or "yearly"

//   useEffect(() => {
//     checkUser();
//   }, []);

//   const checkUser = async () => {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     setUser(user);

//     if (user) {
//       const { data } = await supabase
//         .from("subscriptions")
//         .select("*")
//         .eq("user_id", user.id)
//         .single();
//       setCurrentSubscription(data);
//     }
//   };

//   const formatPrice = (priceUsd) => {
//     if (priceUsd === 0) return "Free";
//     const multiplier = billingCycle === "yearly" ? 10 : 1; // 2 months free on yearly
//     const finalPrice = Number(priceUsd) * multiplier;
    
//     try {
//       return new Intl.NumberFormat('en-US', {
//         style: "currency",
//         currency: "USD",
//         maximumFractionDigits: 0,
//       }).format(finalPrice);
//     } catch {
//       return `$${finalPrice.toFixed(0)}`;
//     }
//   };

//   const subscribe = async (planId) => {
//   if (!user) {
//     setError("Please sign in to subscribe");
//     return;
//   }

//   // Check if already on this plan
//   if (isCurrentPlan(planId)) {
//     setError("You are already subscribed to this plan");
//     return;
//   }

//   setLoading(planId);
//   setError(null);

//   try {
//     const { data, error } = await supabase.functions.invoke(
//       "create-checkout",
//       {
//         body: { planId, billingCycle },
//       },
//     );

//     console.log("Function response:", data);

//     if (error) {
//       console.error("Invocation error:", error);
//       throw new Error(error.message || "Failed to create checkout");
//     }

//     if (data?.error) {
//       console.error("Response error:", data.error);
//       throw new Error(data.error);
//     }

//     if (data?.checkout_url) {
//       console.log("Redirecting to:", data.checkout_url);
//       window.location.href = data.checkout_url;
//     } else {
//       throw new Error("No checkout URL received");
//     }
//   } catch (err) {
//     console.error("Subscription error:", err);
//     setError(err.message || "An unexpected error occurred");
//     setLoading(null);
//   }
// };


//   const isCurrentPlan = (planId) => {
//     return (
//       currentSubscription?.plan === planId &&
//       (currentSubscription?.status === "active" || currentSubscription?.status === "trialing")
//     );
//   };

//   return (
//     <div className="pb-20 px-6">
//     {/* Billing Toggle - CORRECTED VERSION */}
// <div className="flex justify-center items-center gap-4 mb-12">
//   <button
//     onClick={() => setBillingCycle("monthly")}
//     className={`font-medium transition-colors ${
//       billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"
//     }`}
//   >
//     Monthly
//   </button>
  
//   <button
//     type="button"
//     onClick={() => {
//       console.log("Toggle clicked, current:", billingCycle); // Debug log
//       setBillingCycle(prev => {
//         const newValue = prev === "monthly" ? "yearly" : "monthly";
//         console.log("Switching to:", newValue); // Debug log
//         return newValue;
//       });
//     }}
//     className={`toggle-button relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
//       billingCycle === "yearly" ? "bg-blue-600" : "bg-slate-300"
//     }`}
//     aria-label="Toggle billing cycle"
//     aria-pressed={billingCycle === "yearly"}
//     role="switch"
//   >
//     <span
//       className={`toggle-switch absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
//         billingCycle === "yearly" ? "translate-x-8" : "translate-x-0"
//       }`}
//     />
//   </button>
  
//   <button
//     onClick={() => setBillingCycle("yearly")}
//     className={`font-medium transition-colors ${
//       billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"
//     }`}
//   >
//     Yearly
//     <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
//       Save 17%
//     </span>
//   </button>
// </div>


//       {error && (
//         <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
//           <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="text-red-900 font-medium">Payment Error</p>
//             <p className="text-red-700 text-sm mt-1">{error}</p>
//           </div>
//         </div>
//       )}
//       {/* Add this component at the top of your PlanMatrix, before the cards */}
// {currentSubscription && (currentSubscription.status === "active" || currentSubscription.status === "trialing") && (
//   <div className="max-w-4xl mx-auto mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
//     <div className="flex items-start justify-between">
//       <div>
//         <h3 className="text-lg font-bold text-blue-900 mb-1">Current Subscription</h3>
//         <div className="flex items-center gap-3 mb-2">
//           <span className="px-3 py-1 bg-blue-600 text-black rounded-full text-sm font-semibold capitalize">
//             {currentSubscription.plan}
//           </span>
//           {currentSubscription.status === "trialing" && (
//             <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
//               Trial Period
//             </span>
//           )}
//         </div>
//         <p className="text-blue-700 text-sm">
//           {currentSubscription.status === "trialing" 
//             ? `Trial ends on ${new Date(currentSubscription.trial_ends_at).toLocaleDateString()}`
//             : "Active subscription"}
//         </p>
//       </div>
//       <div className="text-right">
//         <p className="text-sm text-blue-600 mb-2">Want to upgrade?</p>
//         <p className="text-sm text-blue-600 mb-2">Select a different plan below</p>
//       </div>
//     </div>
//   </div>
// )}


//       {/* Pricing Cards */}
//       <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto text-black">
//         {BASE_PLANS.map((plan) => {
//           const Icon = plan.icon;
//           const isCurrent = isCurrentPlan(plan.id);

//           return (
//             <div
//               key={plan.id}
//               className={`relative flex flex-col rounded-2xl transition-all duration-300 bg-white ${
//                 plan.popular
//                   ? "border-2 border-blue-600 shadow-2xl md:scale-105 z-10"
//                   : "border border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
//               }`}
//             >
//               {/* Popular Badge */}
//               {plan.popular && (
//                 <div className="absolute -top-5 left-0 right-0 flex justify-center">
//                   <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
//                     <Star className="h-4 w-4 fill-current" />
//                     {plan.badge}
//                   </div>
//                 </div>
//               )}

//               <div className="p-8">
//                 {/* Plan Header */}
//                 <div className="mb-6">
//                   <div
//                     className={`inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4 ${
//                       plan.popular
//                         ? "bg-gradient-to-br from-blue-600 to-blue-500"
//                         : "bg-gradient-to-br from-slate-900 to-slate-900"
//                     }`}
//                   >
//                     <Icon className="h-7 w-7 text-black" />
//                   </div>

//                   <h3 className="text-2xl font-bold text-slate-900 mb-2">
//                     {plan.name}
//                   </h3>
//                   <p className="text-slate-600 text-sm leading-relaxed">
//                     {plan.description}
//                   </p>
//                 </div>

//                 {/* Pricing */}
//                 <div className="mb-8 pb-8 border-b border-slate-100">
//                   <div className="flex items-baseline gap-2 mb-1">
//                     <span className="text-5xl font-bold text-slate-900">
//                       {formatPrice(plan.priceUsd)}
//                     </span>
//                     <span className="text-slate-600 font-medium">
//                       /{billingCycle === "monthly" ? "mo" : "yr"}
//                     </span>
//                   </div>
//                   {billingCycle === "yearly" && (
//                     <p className="text-sm text-green-600 font-medium">
//                       Save {formatPrice(plan.priceUsd * 2)} per year
//                     </p>
//                   )}
//                   <p className="text-sm text-slate-500 mt-2">
//                     7-day free trial • No credit card required
//                   </p>
//                 </div>

//                 {/* Features */}
//                 <div className="space-y-4 mb-8">
//                   {plan.features.map((feature, idx) => (
//                     <div key={idx} className="flex items-start gap-3">
//                       <div
//                         className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
//                           plan.popular ? "bg-blue-100" : "bg-green-100"
//                         }`}
//                       >
//                         <Check
//                           className={`h-3 w-3 ${
//                             plan.popular ? "text-blue-600" : "text-green-600"
//                           }`}
//                         />
//                       </div>
//                       <span className="text-slate-700 text-sm leading-relaxed">
//                         {feature}
//                       </span>
//                     </div>
//                   ))}
//                 </div>

//                 {/* CTA Button */}
//                 <button
//                   disabled={loading !== null || isCurrent}
//                   onClick={() => subscribe(plan.id)}
//                   className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
//                     isCurrent
//                       ? "bg-slate-100 text-slate-500 cursor-not-allowed"
//                       : plan.popular
//                         ? "bg-gradient-to-r from-blue-600 to-blue-500 text-black hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1"
//                         : "bg-slate-900 text-black hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-1"
//                   } ${loading !== null ? "opacity-50 cursor-not-allowed" : ""} disabled:hover:transform-none`}
//                 >
//                   {isCurrent ? (
//                     <>
//                       <Check className="h-5 w-5" />
//                       Current Plan
//                     </>
//                   ) : loading === plan.id ? (
//                     "Processing..."
//                   ) : (
//                     <>
//                       Start Free Trial
//                       <ArrowRight className="h-5 w-5" />
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Trust Footer */}
//       <div className="text-center mt-16">
//         <div className="flex items-center justify-center gap-6 text-black">
//           <div className="flex items-center gap-2">
//             <Shield className="h-4 w-4" />
//             <span className="text-xs">SSL Secured</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Check className="h-4 w-4" />
//             <span className="text-xs">No Hidden Fees</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Star className="h-4 w-4" />
//             <span className="text-xs">30-Day Guarantee</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import {
  Check,
  Zap,
  Building2,
  Sparkles,
  AlertCircle,
  Star,
  ArrowRight,
  Shield,
  Mail,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


const BASE_PLANS = [
  {
    id: "essential",
    name: "Essential",
    priceUsd: 99,
    icon: Sparkles,
    popular: false,
    badge: "Starter",
    description:
      "Perfect for individuals and small teams getting started with AI content.",
    features: [
      "30 AI articles per month",
      "Unlimited team members",
      "Auto keyword research",
      "WordPress integration",
      "AI content editor",
      "1 WordPress site",
      "AI-generated images",
      "150+ languages",
      "Email support",
    ],
    limits: {
      projects: 3,
      keywords: 500,
      articles: 30,
      wpSites: 1,
      autoPublish: false,
      aiImages: true,
      languagesLimit: 150,
    },
  },
  {
    id: "grow",
    name: "Grow",
    priceUsd: 299,
    icon: Zap,
    popular: true,
    badge: "Most Popular",
    description:
      "Ideal for growing businesses that need more content and advanced features.",
    features: [
      "Everything in Essential",
      "60 AI articles per month",
      "3 WordPress sites",
      "Daily auto-publishing",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    limits: {
      projects: 10,
      keywords: 2000,
      articles: 60,
      wpSites: 3,
      autoPublish: true,
      aiImages: true,
      languagesLimit: 150,
    },
  },
  {
    id: "premium",
    name: "Premium",
    priceUsd: 599,
    icon: Building2,
    popular: false,
    badge: "Enterprise",
    description:
      "For agencies and enterprises requiring unlimited content and integrations.",
    features: [
      "Everything in Grow",
      "Unlimited AI articles",
      "Notion integration",
      "WordPress integration",
      "Priority feature requests",
      "Unlimited WordPress sites",
      "Dedicated account manager",
      "Custom integrations",
    ],
    limits: {
      projects: 9999,
      keywords: 999999,
      articles: -1,
      wpSites: -1,
      autoPublish: true,
      aiImages: true,
      languagesLimit: 150,
    },
  },
];


export default function PlanMatrix() {
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");


  useEffect(() => {
    checkUser();
  }, []);


  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);


    if (user) {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setCurrentSubscription(data);
    }
  };


  const formatPrice = (priceUsd) => {
    if (priceUsd === 0) return "Free";
    const multiplier = billingCycle === "yearly" ? 10 : 1;
    const finalPrice = Number(priceUsd) * multiplier;
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(finalPrice);
    } catch {
      return `$${finalPrice.toFixed(0)}`;
    }
  };


  const subscribe = async (planId) => {
    if (!user) {
      setShowMaintenanceModal(true);
      return;
    }

    if (isCurrentPlan(planId)) {
      setShowMaintenanceModal(true);
      return;
    }

    // Show maintenance modal instead of calling edge function
    setShowMaintenanceModal(true);
  };


  const isCurrentPlan = (planId) => {
    return (
      currentSubscription?.plan === planId &&
      (currentSubscription?.status === "active" || currentSubscription?.status === "trialing")
    );
  };


  return (
    <div className="pb-20 px-6">
      {/* Maintenance Modal/Popup */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl relative">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">
                    System Under Maintenance
                  </h3>
                  <p className="text-black text-sm mt-1">
                    Payment processing temporarily unavailable
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <p className="text-gray-700 text-base mb-6 leading-relaxed">
                We apologize for the inconvenience. Our payment system is currently undergoing scheduled maintenance to improve your experience.
              </p>

              {/* Contact Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-xl mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      Want to purchase now?
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Our team is ready to assist you with manual subscription setup
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Contact us at:</p>
                  <a 
                    href="mailto:support@outrankpilot.com"
                    className="text-lg font-bold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 transition-colors inline-flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    support@outrankpilot.com
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <a
                  href="mailto:support@outrankpilot.com"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Send Email
                </a>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4 mb-12">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`font-medium transition-colors ${
            billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"
          }`}
        >
          Monthly
        </button>
        
        <button
          type="button"
          onClick={() => {
            setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly");
          }}
          className={`toggle-button relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            billingCycle === "yearly" ? "bg-blue-600" : "bg-slate-300"
          }`}
          aria-label="Toggle billing cycle"
          aria-pressed={billingCycle === "yearly"}
          role="switch"
        >
          <span
            className={`toggle-switch absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
              billingCycle === "yearly" ? "translate-x-8" : "translate-x-0"
            }`}
          />
        </button>
        
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`font-medium transition-colors ${
            billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"
          }`}
        >
          Yearly
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
            Save 17%
          </span>
        </button>
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription && (currentSubscription.status === "active" || currentSubscription.status === "trialing") && (
        <div className="max-w-4xl mx-auto mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-1">Current Subscription</h3>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold capitalize">
                  {currentSubscription.plan}
                </span>
                {currentSubscription.status === "trialing" && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    Trial Period
                  </span>
                )}
              </div>
              <p className="text-blue-700 text-sm">
                {currentSubscription.status === "trialing" 
                  ? `Trial ends on ${new Date(currentSubscription.trial_ends_at).toLocaleDateString()}`
                  : "Active subscription"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 mb-2">Want to upgrade?</p>
              <p className="text-sm text-blue-600 mb-2">Contact support below</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto text-black">
        {BASE_PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl transition-all duration-300 bg-white ${
                plan.popular
                  ? "border-2 border-blue-600 shadow-2xl md:scale-105 z-10"
                  : "border border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-6">
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4 ${
                      plan.popular
                        ? "bg-gradient-to-br from-blue-600 to-blue-500"
                        : "bg-gradient-to-br from-slate-900 to-slate-800"
                    }`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold text-slate-900">
                      {formatPrice(plan.priceUsd)}
                    </span>
                    <span className="text-slate-600 font-medium">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-sm text-green-600 font-medium">
                      Save {formatPrice(plan.priceUsd * 2)} per year
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-2">
                    7-day free trial • No credit card required
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                          plan.popular ? "bg-blue-100" : "bg-green-100"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${
                            plan.popular ? "text-blue-600" : "text-green-600"
                          }`}
                        />
                      </div>
                      <span className="text-slate-700 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  disabled={isCurrent}
                  onClick={() => subscribe(plan.id)}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                      : plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1"
                        : "bg-slate-900 text-black hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-1"
                  } disabled:hover:transform-none`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="h-5 w-5" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Footer */}
      <div className="text-center mt-16">
        <div className="flex items-center justify-center gap-6 text-black">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span className="text-xs">No Hidden Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="text-xs">30-Day Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
