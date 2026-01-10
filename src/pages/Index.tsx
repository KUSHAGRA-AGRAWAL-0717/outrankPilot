import { useState } from 'react';
import { 
  ArrowRight, 
  Target, 
  FileText, 
  Globe,
  Zap,
  CheckCircle2,
  BarChart3,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
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
    price: '$99',
    period: '/month',
     description: "A hands-free starter: AI articles + basic integrations.",
    features: [
      "30 Articles /mo generated and published on autopilot",
      "Unlimited users in your organization",
      "Auto keyword research (hands-free)",
      "Integrates with WordPress",
      "AI Blog Content Editor access",
      "Manage 1 WordPress site",
      "AI images generated in different styles",
      "Relevant YouTube videos integrated into articles",
      "Articles generated in 150+ languages",
      "Create up to 30 SEO-optimized articles monthly with manual publishing"
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/month',
    description: "Everything in Essential plus backlinks, WP autopublish & more scale.",
    features: [
      "Everything in Essential +",
      "60 Articles /mo generated and published on autopilot",
      "High DR backlinks built for you via Backlink Exchange (auto)",
      "AI Blog Content Editor access",
      "Manage 3 WordPress sites",
      "Daily auto-publishing to WordPress",
      "60 Articles auto-published monthly (Autopilot Mode)"
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$599',
    period: '/month',
    description: "No-limits publishing + integrations and custom feature requests.",
    features: [
      "Everything in Grow +",
      "Unlimited AI articles /mo generated & published on autopilot",
      "Ghost, Webflow, Notion, Wix, Shopify, Webhooks, Framer integrations",
      "Custom feature requests (priority)",
      "Manage unlimited WordPress sites"
    ],
    highlighted: false,
  },
];

const integrations = [
  'WordPress', 'Ghost', 'Webflow', 'Notion', 'Wix', 'Shopify', 'Webhook', 'Framer'
];

const navigationItems = [
  {
    label: 'Features',
    hasDropdown: true,
    dropdownItems: [
      { label: 'Keyword Research', href: '#features' },
      { label: 'SERP Analysis', href: '#features' },
      { label: 'AI Content Briefs', href: '#features' },
      { label: 'WordPress Publishing', href: '#features' },
    ]
  },
  {
    label: 'Services',
    hasDropdown: true,
    dropdownItems: [
      { label: 'E-commerce', href: '/public-services' },
      { label: 'SaaS', href: '/public-services' },
      { label: 'Agencies', href: '/public-services' },
      { label: 'Publishers', href: '/public-services' },
    ]
  },
  {
    label: 'Resources',
    hasDropdown: true,
    dropdownItems: [
      { label: 'Blog', href: '/blog' },
      { label: 'Privacy', href: '/privacy' }
    ]
  },
  {
    label: 'Pricing',
    hasDropdown: false,
    href: '#pricing'
  },
  {
    label: 'Integrations',
    hasDropdown: true,
    dropdownItems: [
      { label: 'Notion', href: '#integrations' },
      { label: 'Google Analytics', href: '#integrations' },
    ]
  },
];

export default function Index() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-2.5 px-6">
        <div className="container mx-auto flex items-center justify-end gap-6 text-sm">
          <a href="tel:1.800.993.5590" className="hover:text-white/80 transition-colors font-medium">
            1.800.993.5590
          </a>
          <span className="text-white/40">|</span>
          <button className="hover:text-white/80 transition-colors font-medium">
            Customer Login
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              
              <img src={logo} alt="OutrankPilot Logo" className="h-7 w-7 rounded-full" />
            </div>
            <span className="text-2xl font-bold text-white">OutrankPilot</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.hasDropdown ? (
                  <>
                    <button className="flex items-center gap-1 text-white hover:text-yellow-300 transition-colors font-medium text-base">
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        {item.dropdownItems.map((dropdownItem) => (
                          <a
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="block px-5 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium"
                          >
                            {dropdownItem.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a 
                    href={item.href}
                    className="text-white hover:text-yellow-300 transition-colors font-medium text-base"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="/auth" className="text-white hover:text-yellow-300 transition-colors font-medium">
              Sign In
            </a>
            <a href="/auth" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
              Request a Demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-xl">
            <div className="container mx-auto px-6 py-4">
              {navigationItems.map((item) => (
                <div key={item.label} className="py-2 border-b border-gray-100 last:border-0">
                  {item.hasDropdown ? (
                    <>
                      <button 
                        className="flex items-center justify-between w-full text-gray-800 font-semibold py-3"
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      >
                        {item.label}
                        <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="pl-4 mt-2 space-y-2 pb-2">
                          {item.dropdownItems.map((dropdownItem) => (
                            <a
                              key={dropdownItem.label}
                              href={dropdownItem.href}
                              className="block py-2 text-gray-600 hover:text-indigo-700 font-medium"
                            >
                              {dropdownItem.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <a 
                      href={item.href}
                      className="block text-gray-800 font-semibold py-3"
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              ))}
              <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
                <a href="/auth" className="block w-full text-gray-700 font-semibold py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-center">
                  Sign In
                </a>
                <a href="/auth" className="block w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-full transition-all shadow-lg text-center">
                  Request a Demo
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-blue-100/50"></div>
        
        <div className="container relative mx-auto px-6 z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 border border-indigo-200 shadow-md">
              <Zap className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700 font-semibold">AI-Powered SEO Content Generation</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl lg:text-7xl leading-tight">
              Create Content That
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Actually Ranks
              </span>
            </h1>
            
            <p className="mb-12 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Generate comprehensive SEO content briefs powered by AI. 
              Analyze SERPs, optimize for keywords, and publish directly to WordPress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/plans" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2 text-lg">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </a>
              <button className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-8 py-4 rounded-full transition-all border-2 border-gray-300 shadow-lg hover:shadow-xl text-lg">
                Watch Demo
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Rank
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From keyword research to publishing, OutrankPilot streamlines your entire content workflow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="bg-gradient-to-br from-white to-indigo-50/50 p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 group cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 group-hover:scale-110 transition-transform shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From zero to published content in four simple steps.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center group">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[55%] w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 z-0" />
                )}
                <div className="relative z-10">
                  <div className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                    <span className="text-2xl font-black text-gray-900">{step.step}</span>
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect with your favorite platforms and publish content everywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 max-w-5xl mx-auto">
            {integrations.map((integration) => (
              <div 
                key={integration}
                className="bg-white border-2 border-gray-200 hover:border-indigo-400 px-8 py-5 rounded-xl hover:shadow-xl hover:-translate-y-2 transition-all flex items-center justify-center min-w-[140px] group"
              >
                <span className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.name}
                className={`bg-white rounded-3xl border-2 relative p-8 lg:p-10 group transition-all hover:shadow-2xl ${
                  plan.highlighted 
                    ? 'border-indigo-500 shadow-2xl scale-105' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                  <p className="text-gray-600 text-base mb-6">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-xl ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 mt-0.5 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a href="/plans" className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 block text-center ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}>
                  Start 7-Day Trial
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All plans include a 7-day free trial. Cancel anytime, no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Outrank Your Competition?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Join thousands of content creators using AI to create SEO-optimized content that ranks.
            </p>
            <a href="/plans" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-5 rounded-full transition-all shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center gap-2 mx-auto text-lg">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                <img src={logo} alt="OutrankPilot Logo" className="h-7 w-7 rounded-full" />
                
              </div>
              <span className="text-2xl font-bold text-gray-900">OutrankPilot</span>
            </div>
            <p className="text-base text-gray-600 text-center md:text-right">
              © 2026 OutrankPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}