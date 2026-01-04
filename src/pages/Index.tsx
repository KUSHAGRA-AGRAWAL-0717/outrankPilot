import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  FileText, 
  Globe,
  Zap,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import logo from "../../public/logo2.jpeg"

const features = [
  {
    icon: Target,
    title: 'Keyword Research',
    description: 'Discover high-value keywords with search volume and difficulty analysis.',
  },
  {
    icon: BarChart3,
    title: 'SERP Analysis',
    description: 'Analyze top-ranking pages to understand what makes content rank.',
  },
  {
    icon: FileText,
    title: 'AI Content Briefs',
    description: 'Generate comprehensive 3,500+ word briefs optimized for SEO.',
  },
  {
    icon: Globe,
    title: 'WordPress Publishing',
    description: 'One-click publishing directly to your WordPress site.',
  },
];

const steps = [
  { step: '01', title: 'Add Your Domain', description: 'Connect your WordPress site in seconds' },
  { step: '02', title: 'Research Keywords', description: 'Find keywords with ranking potential' },
  { step: '03', title: 'Generate Brief', description: 'AI creates comprehensive content outlines' },
  { step: '04', title: 'Publish Content', description: 'One-click publishing to WordPress' },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for individuals and small blogs',
    features: [
      '1 Project',
      '30 Articles/month on auto-pilot',
      '1 User',
      '50 Keywords tracked',
      '100 AI Images/month',
      'Articles in 150+ languages',
      'Unlimited AI Rewrites',
      'YouTube video integration',
      'Auto Keyword Research',
      'Connect to WordPress, Ghost, Webflow',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing businesses and agencies',
    features: [
      '5 Projects',
      '30 Articles/month per project',
      '3 Users',
      '200 Keywords tracked',
      '500 AI Images/month',
      'Articles in 150+ languages',
      'Unlimited AI Rewrites',
      'YouTube video integration',
      'Auto Keyword Research',
      'All integrations: WordPress, Ghost, Webflow, Notion, Wix, Shopify, Webhook, Framer',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$249',
    period: '/month',
    description: 'For large teams and organizations',
    features: [
      'Unlimited Projects',
      '30 Articles/month per project',
      'Unlimited Users',
      'Unlimited Keywords tracked',
      'Unlimited AI Images',
      'Articles in 150+ languages',
      'Unlimited AI Rewrites',
      'YouTube video integration',
      'Auto Keyword Research',
      'All integrations + Priority Support',
      'Custom API access',
      'Dedicated account manager',
    ],
    highlighted: false,
  },
];

const resources = [
  {
    icon: FileText,
    title: 'SEO Best Practices Guide',
    description: 'Learn the fundamentals of creating content that ranks on Google.',
    link: '#',
  },
  {
    icon: BarChart3,
    title: 'Content Strategy Templates',
    description: 'Ready-to-use templates for planning your content calendar.',
    link: '#',
  },
  {
    icon: Zap,
    title: 'AI Writing Tips',
    description: 'Master the art of working with AI to create better content faster.',
    link: '#',
  },
  {
    icon: Target,
    title: 'Keyword Research Playbook',
    description: 'Step-by-step guide to finding keywords that drive traffic.',
    link: '#',
  },
];

const integrations = [
  'WordPress', 'Ghost', 'Webflow', 'Notion', 'Wix', 'Shopify', 'Webhook', 'Framer'
];

export default function Index() {
  const { isAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-cs-bg-light">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/50">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full cs-icon-bg">
          
              <img src={logo} alt="OutrankPilot Logo" className='h-9 w-9 rounded-full' />
            </div>
            <span className="text-xl font-bold cs-heading">OutrankPilot</span>
          </div>
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="cs-btn-primary">Go to Dashboard</button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <button className="cs-btn-secondary">Sign In</button>
                </Link>
                <Link to="/auth">
                  <button className="cs-btn-primary">Get Started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden cs-bg-hero">
        <div className="cs-decorative-shapes">
          <div className="cs-shape-1"></div>
          <div className="cs-shape-2"></div>
          <div className="cs-floating-dots"></div>
        </div>
        
        <div className="container relative mx-auto px-6 z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-5 py-2.5 border border-white/30">
              <Zap className="h-4 w-4 text-cs-accent" />
              <span className="text-white/90 font-medium">AI-Powered SEO Content Generation</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold text-white sm:text-6xl lg:text-7xl leading-tight">
              Create Content That
              <span className="block mt-2 text-cs-accent">Actually Ranks</span>
            </h1>
            
            <p className="mb-12 text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Generate comprehensive SEO content briefs powered by AI. 
              Analyze SERPs, optimize for keywords, and publish directly to WordPress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <button className="cs-btn-primary cs-btn-large">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </Link>
              <button className="cs-btn-secondary-inverted cs-btn-large">
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/80">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cs-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold cs-heading mb-4">
              Everything You Need to Rank
            </h2>
            <p className="text-xl cs-body max-w-2xl mx-auto leading-relaxed">
              From keyword research to publishing, OutrankPilot streamlines your entire content workflow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="cs-card group cursor-pointer hover:bg-cs-bg-light transition-all"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl cs-icon-bg group-hover:scale-105 transition-transform">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-4 text-2xl font-bold cs-heading">{feature.title}</h3>
                <p className="cs-body leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold cs-heading mb-4">
              How It Works
            </h2>
            <p className="text-xl cs-body max-w-2xl mx-auto leading-relaxed">
              From zero to published content in four simple steps.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center group">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[55%] w-24 h-0.5 bg-gradient-to-r from-cs-primary-start to-cs-primary-end z-0" />
                )}
                <div className="relative z-10">
                  <div className="mb-6 mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-cs-primary-start to-cs-primary-end flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                    <span className="text-2xl font-bold text-black">{step.step}</span>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold cs-heading">{step.title}</h3>
                  <p className="cs-body leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 bg-cs-bg-light">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold cs-heading mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl cs-body max-w-2xl mx-auto leading-relaxed">
              Connect with your favorite platforms and publish content everywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 max-w-5xl mx-auto">
            {integrations.map((integration) => (
              <div 
                key={integration}
                className="cs-card px-8 py-6 hover:shadow-xl hover:-translate-y-2 transition-all flex items-center justify-center min-w-[140px]"
              >
                <span className="text-xl font-bold cs-heading">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold cs-heading mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl cs-body max-w-2xl mx-auto leading-relaxed">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name}
                className={`cs-card relative p-8 lg:p-10 group ${plan.highlighted ? 'ring-4 ring-cs-primary-end/10 shadow-2xl bg-gradient-to-br from-cs-primary-end/2 to-transparent border-cs-primary-end/20' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-cs-primary-end text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-3xl font-bold cs-heading mb-3">{plan.name}</h3>
                  <p className="cs-body text-lg mb-6 opacity-90">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-bold cs-heading">{plan.price}</span>
                    <span className="cs-body text-2xl ml-3">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-4 group-hover:translate-x-2 transition-all">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cs-success/20 mt-0.5 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-cs-success" />
                      </div>
                      <span className="cs-body text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/auth">
                  <button className="w-full py-4 rounded-2xl font-semibold transition-all
                    cs-btn-primary shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Start 7-Day Trial
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-lg cs-body max-w-2xl mx-auto">
              All plans include a 7-day free trial. Cancel anytime, no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-cs-bg-light to-white">
        <div className="container mx-auto px-6">
          <div className="cs-cta-box max-w-4xl mx-auto">
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold cs-heading mb-6">
                Ready to Outrank Your Competition?
              </h2>
              <p className="text-xl cs-body mb-10 leading-relaxed max-w-2xl mx-auto">
                Join thousands of content creators using AI to create SEO-optimized content that ranks.
              </p>
              <Link to="/auth">
                <button className="cs-btn-primary cs-btn-large shadow-xl hover:shadow-2xl">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cs-body/20 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full cs-icon-bg">
                
                <img src={logo} alt="OutrankPilot Logo" className='h-9 w-9 rounded-full' />
              </div>
              <span className="text-2xl font-bold cs-heading">OutrankPilot</span>
            </div>
            <p className="text-lg cs-muted text-center md:text-right">
              © 2026 OutrankPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
