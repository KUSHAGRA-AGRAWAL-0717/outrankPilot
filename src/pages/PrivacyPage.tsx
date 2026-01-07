import React from 'react';
import { ArrowLeft, Shield, Lock, UserCheck } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      {/* Hero */}
      <section className="gradient-hero text-black py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl text-[#000000] mb-8">Your data security is our priority. We comply with global standards.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="space-y-16">
          <div className="bg-white rounded-3xl p-12 shadow-xl">
            <h2 className="text-3xl font-bold text-[#0B1F3B] mb-8 flex items-center gap-4">
              <div className="icon-circle text-[#FFD84D]">
                <Shield className="w-6 h-6" />
              </div>
              Data Collection
            </h2>
            <p className="text-lg text-[#5B6B8A] leading-relaxed mb-6">We collect minimal data like email for auth (Supabase), usage stats for SaaS improvement. No payment info stored.</p>
          </div>

          <div className="bg-white rounded-3xl p-12 shadow-xl card-hover">
            <h2 className="text-3xl font-bold text-[#0B1F3B] mb-8 flex items-center gap-4">
              <div className="icon-circle text-[#FFD84D]">
                <Lock className="w-6 h-6" />
              </div>
              Security Measures
            </h2>
            <p className="text-lg text-[#5B6B8A] leading-relaxed mb-6">Supabase RLS, encryption, MFA. Data retained 30 days post-deletion request. Breach notification within 72h.</p>
          </div>

          <div className="bg-white rounded-3xl p-12 shadow-xl card-hover">
            <h2 className="text-3xl font-bold text-[#0B1F3B] mb-8 flex items-center gap-4">
              <div className="icon-circle text-[#FFD84D]">
                <UserCheck className="w-6 h-6" />
              </div>
              Your Rights
            </h2>
            <ul className="space-y-3 text-lg text-[#5B6B8A]">
              <li>• Access, correct, or delete your data anytime</li>
              <li>• Opt-out of analytics via settings</li>
              <li>• Contact: outrankpilot.com</li>
            </ul>
            <a href="/public-services" className="btn-primary mt-8 inline-flex px-8 py-4 text-lg font-semibold text-black">Exercise Rights</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
