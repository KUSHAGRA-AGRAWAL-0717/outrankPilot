import { 
  FileText, 
  ArrowRight,
  TrendingUp,
  Eye,
  Clock,
  Target,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from "../../public/logo2.jpeg";

const examples = [
  {
    id: 1,
    category: 'Technology',
    title: 'The Complete Guide to Cloud Computing in 2026',
    excerpt: 'An in-depth exploration of cloud computing trends, best practices, and future predictions for businesses of all sizes.',
    wordCount: 3850,
    readTime: '18 min',
    ranking: '#3 on Google',
    features: ['Comprehensive research', 'SEO optimized', 'Expert insights', 'Visual elements'],
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 2,
    category: 'Marketing',
    title: 'Email Marketing Strategies That Actually Convert',
    excerpt: 'Proven email marketing tactics with real-world examples, templates, and conversion optimization techniques.',
    wordCount: 4200,
    readTime: '20 min',
    ranking: '#1 on Google',
    features: ['Data-driven', 'Actionable tips', 'Case studies', 'Templates included'],
    color: 'from-purple-600 to-indigo-600'
  },
  {
    id: 3,
    category: 'Finance',
    title: 'Personal Finance 101: Building Wealth from Scratch',
    excerpt: 'A beginner-friendly guide to personal finance covering budgeting, investing, and long-term wealth building strategies.',
    wordCount: 3600,
    readTime: '17 min',
    ranking: '#2 on Google',
    features: ['Step-by-step guide', 'Calculator tools', 'Expert reviewed', 'Beginner friendly'],
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 4,
    category: 'Health & Fitness',
    title: 'Science-Based Nutrition Guide for Optimal Health',
    excerpt: 'Evidence-based nutrition information backed by scientific research and practical meal planning advice.',
    wordCount: 4500,
    readTime: '22 min',
    ranking: '#1 on Google',
    features: ['Research-backed', 'Meal plans', 'Infographics', 'Expert quotes'],
    color: 'from-orange-600 to-red-600'
  },
  {
    id: 5,
    category: 'E-commerce',
    title: 'Shopify Store Optimization: The Ultimate Checklist',
    excerpt: 'Complete optimization guide for Shopify stores covering SEO, conversion rate optimization, and performance.',
    wordCount: 3900,
    readTime: '19 min',
    ranking: '#4 on Google',
    features: ['Checklists', 'Screenshots', 'Tools list', 'Implementation guide'],
    color: 'from-pink-600 to-rose-600'
  },
  {
    id: 6,
    category: 'SaaS',
    title: 'SaaS Pricing Strategies: Finding Your Perfect Model',
    excerpt: 'In-depth analysis of different SaaS pricing models with examples from successful companies.',
    wordCount: 4100,
    readTime: '20 min',
    ranking: '#2 on Google',
    features: ['Pricing examples', 'Calculator', 'Comparison charts', 'Industry insights'],
    color: 'from-indigo-600 to-purple-600'
  }
];

export default function Examples() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-blue-100/50"></div>
        
        <div className="container relative mx-auto px-6 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 border border-indigo-200 shadow-md">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700 font-semibold">See What's Possible</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl leading-tight">
              Content Examples That
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Actually Rank
              </span>
            </h1>
            
            <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Browse real examples of content created with OutrankPilot that achieved top rankings on Google.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { label: 'Total Articles', value: '10,000+', icon: FileText },
              { label: 'Avg Word Count', value: '3,850', icon: Target },
              { label: 'Page 1 Rankings', value: '87%', icon: TrendingUp },
              { label: 'Avg Read Time', value: '19 min', icon: Clock }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {examples.map((example) => (
                <div 
                  key={example.id}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all group overflow-hidden"
                >
                  {/* Card Header */}
                  <div className={`h-2 bg-gradient-to-r ${example.color}`}></div>
                  
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 mb-4">
                      <span className="text-sm font-semibold text-indigo-700">{example.category}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {example.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {example.excerpt}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{example.wordCount} words</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{example.readTime}</span>
                      </div>
                    </div>

                    {/* Ranking Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-bold text-green-600">{example.ranking}</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {example.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                   
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Your Own?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Start generating high-ranking content today with our 7-day free trial.
            </p>
            <button 
              onClick={() => navigate('/plans')}
              className="inline-flex bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-5 rounded-full transition-all shadow-2xl hover:shadow-3xl hover:scale-105 items-center gap-2 text-lg"
            >
              Start Creating Now
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
