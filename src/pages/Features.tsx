import { 
  Brain, 
  Search, 
  FileText, 
  BarChart3, 
  FileCode, 
  Globe,
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  Users,
  Calendar,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from "../../public/logo2.jpeg";

const allFeatures = [
  {
    id: 'ai-autopilot',
    icon: Brain,
    color: 'from-purple-600 to-indigo-600',
    title: 'AI Autopilot Content',
    subtitle: 'Content creation on complete autopilot',
    description: 'Let AI handle your entire content workflow from ideation to publication. Set it once and watch your content library grow automatically.',
    benefits: [
      'Fully automated content generation and publishing',
      'Smart scheduling based on optimal posting times',
      'Automatic keyword research and topic discovery',
      'Self-optimizing content based on performance data',
      'Hands-free workflow that runs 24/7',
      'Multi-site management from single dashboard'
    ],
    stats: [
      { label: 'Time Saved', value: '95%' },
      { label: 'Articles/Month', value: '30-Unlimited' },
      { label: 'Automation Level', value: '100%' }
    ]
  },
  {
    id: 'keyword-research',
    icon: Search,
    color: 'from-blue-600 to-cyan-600',
    title: 'Keyword Research',
    subtitle: 'Find keywords that actually drive traffic',
    description: 'Discover high-value keywords with comprehensive metrics including search volume, difficulty, CPC, and search intent analysis.',
    benefits: [
      'Real-time search volume and trend data',
      'Keyword difficulty scoring (0-100)',
      'Cost-per-click (CPC) analysis for commercial keywords',
      'Search intent classification (informational, commercial, transactional)',
      'Long-tail keyword suggestions',
      'Competitor keyword gap analysis'
    ],
    stats: [
      { label: 'Keywords Analyzed', value: '10M+' },
      { label: 'Accuracy Rate', value: '98%' },
      { label: 'Data Sources', value: '50+' }
    ]
  },
  {
    id: 'content-generator',
    icon: FileText,
    color: 'from-green-600 to-emerald-600',
    title: 'AI Content Generator',
    subtitle: 'Create comprehensive content briefs in minutes',
    description: 'Generate 3,500+ word SEO-optimized content briefs that cover every angle of your target topic with AI-powered research and structuring.',
    benefits: [
      'Comprehensive 3,500+ word briefs',
      'SEO-optimized heading structure (H1-H6)',
      'Competitor content analysis integration',
      'NLP-optimized keyword placement',
      'Readability scoring and optimization',
      'Multi-language support (150+ languages)'
    ],
    stats: [
      { label: 'Avg Word Count', value: '3,500+' },
      { label: 'Generation Time', value: '5-7 min' },
      { label: 'Languages', value: '150+' }
    ]
  },
  {
    id: 'serp-analysis',
    icon: BarChart3,
    color: 'from-orange-600 to-red-600',
    title: 'SERP Analysis',
    subtitle: 'Understand what makes content rank',
    description: 'Deep analysis of top-ranking pages to uncover the exact strategies and content elements that drive rankings in your niche.',
    benefits: [
      'Top 10 competitor content breakdown',
      'Word count and content depth analysis',
      'Backlink profile examination',
      'Content structure and heading analysis',
      'Media usage patterns (images, videos)',
      'User engagement metrics correlation'
    ],
    stats: [
      { label: 'SERPs Analyzed', value: '500K+' },
      { label: 'Ranking Factors', value: '200+' },
      { label: 'Update Frequency', value: 'Daily' }
    ]
  },
  {
    id: 'content-planner',
    icon: FileCode,
    color: 'from-pink-600 to-rose-600',
    title: 'Content Planner',
    subtitle: 'Plan and schedule your content strategy',
    description: 'Strategic content calendar with AI-powered recommendations for topics, timing, and sequencing to maximize your content ROI.',
    benefits: [
      'Visual content calendar interface',
      'AI-powered topic recommendations',
      'Optimal publishing schedule suggestions',
      'Content gap identification',
      'Campaign and series planning',
      'Team collaboration features'
    ],
    stats: [
      { label: 'Planning Efficiency', value: '80%' },
      { label: 'Team Members', value: 'Unlimited' },
      { label: 'Projects', value: 'Unlimited' }
    ]
  },
  {
    id: 'wordpress-publishing',
    icon: Globe,
    color: 'from-indigo-600 to-purple-600',
    title: 'WordPress Publishing',
    subtitle: 'One-click publishing to WordPress and beyond',
    description: 'Seamlessly publish your content directly to WordPress, Ghost, Webflow, and 8+ other platforms with automatic formatting and optimization.',
    benefits: [
      'One-click publishing to multiple platforms',
      'Automatic image optimization and CDN',
      'SEO meta tags auto-generation',
      'Scheduled and recurring publishing',
      'Category and tag automation',
      'Custom post templates support'
    ],
    stats: [
      { label: 'Platforms', value: '8+' },
      { label: 'Publishing Time', value: '<30 sec' },
      { label: 'Success Rate', value: '99.9%' }
    ]
  }
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              <img src={logo} alt="OutrankPilot Logo" className="h-7 w-7 rounded-full" />
            </div>
            <span className="text-2xl font-bold text-white">OutrankPilot</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/auth')} className="text-white hover:text-yellow-300 transition-colors font-medium">
              Sign In
            </button>
            <button onClick={() => navigate('/auth')} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
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
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 border border-indigo-200 shadow-md">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700 font-semibold">Powerful Features for Modern Content Teams</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl leading-tight">
              Everything You Need to
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Dominate SEO Rankings
              </span>
            </h1>
            
            <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From keyword research to automated publishing, OutrankPilot provides all the tools you need to create, optimize, and publish content that ranks.
            </p>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      {allFeatures.map((feature, index) => (
        <section 
          key={feature.id} 
          id={feature.id}
          className={`py-24 ${index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}
        >
          <div className="container mx-auto px-6">
            <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-16 max-w-7xl mx-auto`}>
              {/* Content Side */}
              <div className="flex-1 space-y-6">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-xl`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-xl text-indigo-600 font-semibold mb-4">
                    {feature.subtitle}
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => navigate('/auth')}
                    className={`bg-gradient-to-r ${feature.color} hover:opacity-90 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2`}
                  >
                    Try This Feature
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats Side */}
              <div className="flex-1">
                <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-200">
                  <div className="space-y-6">
                    {feature.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                        <span className="text-gray-700 font-semibold text-lg">{stat.label}</span>
                        <span className={`text-4xl font-black bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                    <div className="flex items-start gap-4">
                      <Zap className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Pro Tip</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          Combine this feature with others for maximum impact. Our AI learns your preferences over time for even better results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Content Strategy?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Start your 7-day free trial and experience all features with no credit card required.
            </p>
            <button 
              onClick={() => navigate('/plans')}
              className="inline-flex bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-5 rounded-full transition-all shadow-2xl hover:shadow-3xl hover:scale-105 items-center gap-2 text-lg"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </button>
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
