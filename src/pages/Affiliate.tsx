import { 
  DollarSign, 
  Users, 
  TrendingUp,
  Gift,
  ArrowRight,
  CheckCircle2,
  Zap,
  Award,
  Target,
  Clock,
  BarChart3,
  Link2,
  Rocket,
  Infinity
} from 'lucide-react';
import { useState } from 'react';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Fast-Growing SaaS Platform',
    description: 'Outrankpilot is growing 25–30% month over month, with 500+ active customers and rising. Our fastest affiliates are already earning $1,000+ per month, and the audience keeps expanding.',
    color: 'from-purple-600 to-indigo-600'
  },
  {
    icon: DollarSign,
    title: 'High-Value, Lifetime Commissions',
    description: 'Earn 35% recurring commission for life on every referred customer. With our average plan of $99–$599/month, from a single signup.',
    color: 'from-green-600 to-emerald-600'
  },
  {
    icon: Infinity,
    title: 'Unlimited Earnings',
    description: 'There are no limits on referrals or payouts. The more customers you send, the more you earn, every month, forever.',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    icon: Zap,
    title: 'Easy Product That Sells Itself',
    description: 'Outrankpilot automates SEO keyword research, AI-written blog posts, internal linking, and publishing to WordPress, Webflow, Notion, and more. It solves real pain points for founders, agencies, and marketers — which makes it extremely easy to recommend.',
    color: 'from-orange-600 to-red-600'
  },
  {
    icon: Clock,
    title: 'Reliable Monthly PayPal Payments',
    description: 'Commissions are paid monthly via credit card once you reach the $50 minimum payout. No delays. No hidden rules.',
    color: 'from-pink-600 to-rose-600'
  }
];

const steps = [
  {
    number: '1',
    title: 'Join the Outrankpilot Affiliate Program',
    description: 'Sign up in minutes using our simple registration form. No paid plan required — anyone can become an affiliate instantly.',
    icon: Users
  },
  {
    number: '2',
    title: 'Get Your Referral Link & Promo Assets',
    description: 'Access your personal affiliate dashboard to copy your unique tracking link, download banners, copy, and visuals, and track clicks, signups, and commissions in real time. Promote Outrankpilot through blogs, YouTube, newsletters, social media, or client recommendations.',
    icon: Link2
  },
  {
    number: '3',
    title: 'Earn Recurring Commissions Automatically',
    description: 'Every customer who signs up through your link earns you 35% commission — paid monthly for life as long as they remain a customer. Minimum payout: $50. Payment method: Credit card.',
    icon: Rocket
  }
];

const features = [
  'SEO keyword research',
  'AI-written blog posts',
  'Internal linking',
  'Publishing to WordPress, Webflow, Notion, and more'
];

export default function Affiliate() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    
    setTimeout(() => {
      alert('Application submitted! We\'ll review and get back to you within 24 hours.');
      setFormData({ name: '', email: '', website: '' });
      setSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              <Zap className="h-7 w-7 text-gray-900" />
            </div>
            <span className="text-2xl font-bold text-white">Outrankpilot</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-white hover:text-yellow-300 transition-colors font-medium">
              Sign In
            </button>
            <button className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-blue-100/50"></div>
        
        <div className="container relative mx-auto px-6 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-4 text-5xl font-extrabold text-gray-900 sm:text-6xl leading-tight">
              Outrankpilot Affiliate Program
            </h1>
            
            <h2 className="mb-6 text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent sm:text-4xl">
              Earn 35% Lifetime Recurring Commission
            </h2>
            
            <p className="mb-6 text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Build predictable monthly income by promoting the AI SEO platform businesses use to grow on autopilot.
            </p>

            <p className="mb-10 text-lg text-gray-600 max-w-3xl mx-auto">
              Become an Outrankpilot affiliate and earn recurring commissions for every customer you refer — for as long as they stay subscribed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2 text-lg"
              >
                Become an Affiliate Partner
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Promote Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Promote Outrankpilot
              </h2>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Publish SEO-Optimized Content Daily, Without the Work
              </h3>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Outrankpilot isn't just another AI writer. It's a full SEO content engine businesses rely on to grow traffic, rankings, and authority automatically.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div 
                  key={benefit.title}
                  className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all"
                >
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${benefit.color} shadow-lg`}>
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Outrankpilot Automates:
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 mt-6 text-center">
                It solves real pain points for founders, agencies, and marketers — which makes it extremely easy to recommend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How the Outrankpilot Affiliate Program Works
              </h2>
              <p className="text-xl text-gray-600">
                Start Earning Recurring Income in 3 Simple Steps
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div 
                  key={step.number}
                  className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl border-2 border-indigo-200 p-8 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold shadow-lg">
                      {step.number}
                    </div>
                    <step.icon className="h-10 w-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ready to Earn With Outrankpilot?
              </h2>
              <p className="text-xl text-gray-600">
                Join hundreds of affiliates already earning recurring income by promoting one of the fastest-growing AI SEO platforms on the market.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Website/Social Media URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="https://yoursite.com"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {submitting ? 'Submitting...' : 'Become an Affiliate Partner Today'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2026 Outrankpilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}