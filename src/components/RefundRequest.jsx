import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Check, CreditCard, Building2, User, FileText } from "lucide-react";

export default function RefundRequest({ subscription }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    reason: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("request-refund", {
        body: formData
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-green-200">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center justify-center">
                <div className="bg-white rounded-full p-4">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-8 text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Refund Request Submitted Successfully!
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Your refund request has been received and is being processed.
              </p>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <p className="text-green-800 font-semibold mb-2">
                  What happens next?
                </p>
                <p className="text-green-700">
                  Your refund will be processed within <span className="font-bold">5-7 business days</span> and credited to your provided bank account.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-gray-200">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Request a Refund
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You can request a refund within 7 days of your subscription start date. Please provide your details below.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white">Refund Request Form</h2>
            <p className="text-indigo-100 mt-1">All fields are required</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Reason */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Reason for Refund
                </label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Please tell us why you're requesting a refund. Your feedback helps us improve our service..."
                />
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Bank Account Details
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your refund will be sent to this account within 5-7 business days
                </p>

                <div className="space-y-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Bank Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      placeholder="e.g., Access Bank, GTBank, First Bank"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Account Number
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      placeholder="1234567890"
                      maxLength={10}
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Account Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">
                      Important Information
                    </h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Refunds are only available within 7 days of subscription</li>
                      <li>• Processing typically takes 5-7 business days</li>
                      <li>• Please ensure your bank details are correct</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.reason || !formData.bankName || !formData.accountNumber || !formData.accountName}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-black rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Submit Refund Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@outrankpilot.com" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              support@outrankpilot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}