import { 
  MessageSquare, 
  Mail, 
  Book, 
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Search,
  FileText,
  Video
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo from "../../public/logo2.jpeg";

const faqs = [
  {
    question: 'How does the 7-day free trial work?',
    answer: 'Sign up with your email, no credit card required. You get full access to all features for 7 days. Cancel anytime before the trial ends and you won\'t be charged.'
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.'
  },
  {
    question: 'How many WordPress sites can I connect?',
    answer: 'Starter plan: 1 site, Professional: 3 sites, Enterprise: Unlimited sites. All plans include unlimited team members.'
  },
  {
    question: 'What languages are supported?',
    answer: 'OutrankPilot supports content generation in 150+ languages including English, Spanish, French, German, Chinese, Japanese, and more.'
  },
  {
    question: 'How accurate is the keyword research data?',
    answer: 'We aggregate data from 50+ sources including Google, SEMrush, Ahrefs APIs to provide 98% accuracy on search volume and difficulty scores.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely! No contracts, cancel anytime from your dashboard. You\'ll retain access until the end of your billing period.'
  }
];

const supportChannels = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    availability: 'Mon-Fri, 9AM-6PM EST',
    action: 'Start Chat',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us an email and we\'ll respond within 24 hours : outrankpilot@gmail.com',
    availability: '24-hour response time',
    action: 'Send Email',
    color: 'from-purple-600 to-indigo-600'
  },
  {
    icon: Book,
    title: 'Documentation',
    description: 'Browse our comprehensive knowledge base',
    availability: 'Available 24/7',
    action: 'View Docs',
    color: 'from-green-600 to-emerald-600'
  },
  // {
  //   icon: Video,
  //   title: 'Video Tutorials',
  //   description: 'Watch step-by-step video guides',
  //   availability: '50+ tutorials available',
  //   action: 'Watch Now',
  //   color: 'from-orange-600 to-red-600'
  // }
];

export default function Support() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Support ticket submitted! We\'ll respond within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
     

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-blue-100/50"></div>
        
        <div className="container relative mx-auto px-6 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 border border-indigo-200 shadow-md">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700 font-semibold">We're Here to Help</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl leading-tight">
              How Can We
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Help You Today?
              </span>
            </h1>
            
            <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Get the support you need through our multiple channels. We're committed to your success.
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Choose Your Support Channel
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {supportChannels.map((channel) => (
                <div 
                  key={channel.title}
                  className="bg-gradient-to-br from-white to-indigo-50/50 p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${channel.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <channel.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{channel.title}</h3>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">{channel.description}</p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{channel.availability}</span>
                  </div>
                  {/* <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-all">
                    {channel.action}
                  </button> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      {/* <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Submit a Support Ticket
              </h2>
              <p className="text-lg text-gray-600">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="John Doe"
                      required
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
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
                    placeholder="Describe your issue or question..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600">
                Quick answers to common questions
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <HelpCircle className={`h-6 w-6 text-indigo-600 flex-shrink-0 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2026 OutrankPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
