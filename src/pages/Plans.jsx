import PlanMatrix from "../components/PlanMatrix";
import ProtectedRoute from "../components/ProtectedRoute";
import { Shield, Zap, Users, TrendingUp } from "lucide-react";

export default function PlansPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="text-center pt-20 pb-12 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>7-Day Free Trial • No Credit Card Required</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Simple, Transparent Pricing
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your business. Scale as you grow with flexible pricing designed for teams of all sizes.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Secure Payments</h3>
              <p className="text-sm text-slate-600">256-bit SSL encryption</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Cancel Anytime</h3>
              <p className="text-sm text-slate-600">No long-term contracts</p>
            </div>

           

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Money Back</h3>
              <p className="text-sm text-slate-600">30-day guarantee</p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <PlanMatrix />

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600">
                We accept all major credit cards, debit cards, and support local payment methods through Paystack for your convenience.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-slate-600">
                No setup fees, no hidden charges. The price you see is exactly what you pay. 100% transparent pricing.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                What happens after the trial ends?
              </h3>
              <p className="text-slate-600">
                Your 7-day trial is completely free with full access to features. After it ends, you'll only be charged if you choose to continue with a paid plan.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our team is here to help you find the perfect plan for your needs.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              <a href="mailto:support@outrankpilot.com">Contact Sales at : support@outrankpilot.com</a>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
