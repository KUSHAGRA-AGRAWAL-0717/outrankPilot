import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  X,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  XCircle,
  Search,
  Brain,
  BookOpen,
  Settings,
  FileCode,
  MessageSquare,
  Gift,
} from "lucide-react";
import logo from "../../public/logo2.jpeg";
// import Navbar from "../components/Navbar";

const features = [
  {
    icon: Target,
    title: "Keyword Research",
    description:
      "Discover high-value keywords with search volume and difficulty analysis.",
    id: "keyword-research",
  },
  {
    icon: BarChart3,
    title: "SERP Analysis",
    description:
      "Analyze top-ranking pages to understand what makes content rank.",
    id: "serp-analysis",
  },
  {
    icon: FileText,
    title: "AI Content Briefs",
    description: "Generate comprehensive 3,500+ word briefs optimized for SEO.",
    id: "ai-content",
  },
  {
    icon: Globe,
    title: "WordPress Publishing",
    description: "One-click publishing directly to your WordPress site.",
    id: "wordpress-publishing",
  },
];

const comparisonData = [
  {
    category: "Content Production",
    manual: "4-6 hours",
    basic: "45-90 minutes",
    outrank: "5-7 minutes, fully hands-free",
  },
  {
    category: "Articles Per Month",
    manual: "4-8 articles",
    basic: "10-15 articles",
    outrank: "30-Unlimited articles",
  },
  {
    category: "Workflow",
    manual: "Manual & time-consuming",
    basic: "User-prompted",
    outrank: "Fully automated, done for you",
  },
  {
    category: "SEO Optimization",
    manual: "Manual SEO checks",
    basic: "Basic optimization",
    outrank: "Advanced SERP + intent optimization",
  },
  {
    category: "Content Quality",
    manual: "Depends on writer",
    basic: "Generic AI text",
    outrank: "Human-like, brand-ready articles",
  },
  {
    category: "Publishing",
    manual: "Copy-paste",
    basic: "Manual",
    outrank: "Auto-publish to WP, Ghost, Webflow, Wix, Shopify & more",
  },
  {
    category: "Updates",
    manual: "Never updated",
    basic: "Never updated",
    outrank: "Continuous updates & evergreen refresh",
  },
  {
    category: "Images",
    manual: "Stock images",
    basic: "None",
    outrank: "AI-generated branded images (multiple styles)",
  },
  {
    category: "Backlinks",
    manual: "Manual outreach",
    basic: "Not included",
    outrank: "High-DR backlinks on autopilot (Grow+)",
  },
  {
    category: "Languages",
    manual: "1 language",
    basic: "Limited",
    outrank: "150+ languages",
  },
  {
    category: "Scalability",
    manual: "Not scalable",
    basic: "Single site",
    outrank: "1 → Unlimited WordPress sites",
  },
  {
    category: "Team Size",
    manual: "Single author",
    basic: "Seat-based pricing",
    outrank: "Unlimited users per organization",
  },
];

const steps = [
  {
    step: "1",
    title: "Create a Series",
    description:
      "Choose a topic for your content series. Select from our preset list or create a custom prompt. Our AI will begin crafting your first unique article immediately.",
  },
  {
    step: "2",
    title: "Preview and Customize",
    description:
      "Edit your posting schedule, connect your channels, and let AutoShorts handle the rest. We'll take care of creating and posting while you relax.",
  },
  {
    step: "3",
    title: "Watch Your Channel Grow",
    description:
      "Connect your WordPress, Ghost, or other platforms. Set your publishing schedule and preferences for maximum impact.",
  },
];

const integrations = [
  "WordPress",
  "Ghost",
  "Webflow",
  "Notion",
  "Wix",
  "Shopify",
  "Webhook",
  "Framer",
];

const navigationItems = [
  {
    label: "Products",
    hasDropdown: true,
    sections: [
      {
        title: "Key Features",
        items: [
          {
            icon: Brain,
            label: "AI Autopilot Content",
            description:
              "Automatically generate and publish SEO-optimized content",
            href: "/features/ai-autopilot",
          },
          {
            icon: Search,
            label: "Keyword Research",
            description: "Find high-value keywords with data-driven insights",
            href: "/features/keyword-research",
          },
          {
            icon: BarChart3,
            label: "SERP Analysis",
            description: "Analyze competitors and understand ranking factors",
            href: "/features/serp-analysis",
          },
          {
            icon: FileText,
            label: "AI Content Generator",
            description: "Create comprehensive content briefs in minutes",
            href: "/features/content-generator",
          },
          {
            icon: FileCode,
            label: "Content Planner",
            description: "Plan and schedule your content strategy",
            href: "/features/content-planner",
          },
          {
            icon: Globe,
            label: "WordPress Publishing",
            description: "One-click publishing to WordPress and more",
            href: "/features/wordpress-publishing",
          },
        ],
      },
    ],
    featured: {
      title: "Latest Feature",
      label: "AI Content Briefs",
      description:
        "Generate comprehensive 3,500+ word SEO-optimized content briefs powered by advanced AI technology.",
      href: "/features/ai-content",
      image: "📝",
    },
  },
  {
    label: "Resources",
    hasDropdown: true,
    sections: [
      {
        title: "Learn & Support",
        items: [
          {
            icon: BookOpen,
            label: "Blog & Articles",
            description: "Learn SEO tips and content marketing strategies",
            href: "/blog",
          },
          {
            icon: FileText,
            label: "Writing Examples",
            description: "See sample content created by OutrankPilot",
            href: "/examples",
          },
          {
            icon: Target,
            label: "How it Works",
            description: "Understand our AI-powered workflow",
            href: "#how-it-works",
          },
          {
            icon: Settings,
            label: "Integrations",
            description: "Connect with your favorite platforms",
            href: "#integrations",
          },
          {
            icon: MessageSquare,
            label: "Support Ticket",
            description: "Get help from our support team",
            href: "/support",
          },
          {
            icon: Gift,
            label: "Affiliate Program",
            description: "Earn by referring OutrankPilot",
            href: "/affiliate-program",
          },
        ],
      },
    ],
    featured: {
      title: "Popular Resource",
      label: "SEO Guide 2025",
      description:
        "Complete guide to ranking your content in 2025. Learn the latest strategies and best practices.",
      href: "/blog",
      image: "📚",
    },
  },
  {
    label: "Pricing",
    hasDropdown: false,
    href: "#pricing",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
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
      "Create up to 30 SEO-optimized articles monthly with manual publishing",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/month",
    description:
      "Everything in Essential plus backlinks, WP autopublish & more scale.",
    features: [
      "Everything in Essential +",
      "60 Articles /mo generated and published on autopilot",
      "AI Blog Content Editor access",
      "Manage 3 WordPress sites",
      "Daily auto-publishing to WordPress",
      "60 Articles auto-published monthly (Autopilot Mode)",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$599",
    period: "/month",
    description:
      "No-limits publishing + integrations and custom feature requests.",
    features: [
      "Everything in Grow +",
      "Unlimited AI articles /mo generated & published on autopilot",
      "Ghost, Webflow, Notion, Wix, Shopify, Webhooks, Framer integrations",
      "Custom feature requests (priority)",
      "Manage unlimited WordPress sites",
    ],
    highlighted: false,
  },
];

export default function Index() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const location = useLocation();

useEffect(() => {
  if (location.hash) {
    const id = location.hash.replace("#", "");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({
          top: el.offsetTop - 80,
          behavior: "smooth",
        });
      }
    }, 100);
  }
}, [location]);

  const handleMouseEnter = (itemLabel) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(itemLabel);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
  };
  const toggleDropdown = (itemLabel) => {
    setOpenDropdown(openDropdown === itemLabel ? null : itemLabel);
  };
  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
     {/* <Navbar
        navigationItems={navigationItems}
        openDropdown={openDropdown}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeave={handleMouseLeave}
        handleDropdownMouseEnter={handleDropdownMouseEnter}
        handleDropdownMouseLeave={handleDropdownMouseLeave}
        toggleDropdown={toggleDropdown}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />  */}
      

    
      
      <section id="hero" className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-purple-100/30 to-blue-100/50"></div>

        <div className="container relative mx-auto px-6 z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 border border-indigo-200 shadow-md">
              <Zap className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-700 font-semibold">
                AI-Powered SEO Content Generation
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl lg:text-7xl leading-tight">
              Create Content That
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Actually Ranks
              </span>
            </h1>

            <p className="mb-12 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Generate comprehensive SEO content briefs powered by AI. Analyze
              SERPs, optimize for keywords, and publish directly to WordPress.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/plans"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2 text-lg"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              {[
                "No credit card required",
                "7-day free trial",
                "Cancel anytime",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* With vs Without Comparison Section */}
      <section id="comparison" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How OutrankPilot Stacks Up
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See why modern teams choose true content automation over manual
              and basic AI tools
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-800">
                  <th className="text-left p-6 font-bold text-white text-lg border-r border-gray-700"></th>
                  <th className="text-center p-6 font-bold text-white text-lg border-r border-gray-700">
                    Manual Content
                    <br />
                    Creation
                  </th>
                  <th className="text-center p-6 font-bold text-white text-lg border-r border-gray-700">
                    Basic AI Writers
                  </th>
                  <th className="text-center p-6 font-bold text-white text-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                    OUTRANKPILOT
                    <br />
                    Autopilot
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="p-5 font-bold text-gray-900 border-r border-b border-gray-200">
                      {row.category}
                    </td>
                    <td className="p-5 text-center text-gray-700 border-r border-b border-gray-200">
                      {row.manual}
                    </td>
                    <td className="p-5 text-center text-gray-700 border-r border-b border-gray-200">
                      {row.basic}
                    </td>
                    <td className="p-5 text-center font-semibold text-indigo-900 bg-indigo-50 border-b border-indigo-200">
                      {row.outrank}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/plans"
              className="inline-flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 items-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Rank
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From keyword research to publishing, OutrankPilot streamlines your
              entire content workflow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                id={feature.id}
                className="bg-gradient-to-br from-white to-indigo-50/50 p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 group cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 group-hover:scale-110 transition-transform shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: "#6B46FF" }}
            >
              HOW DOES IT WORK?
            </h2>
            <p className="text-2xl font-semibold text-gray-700">
              FACELESS CHANNELS ON AUTO-PILOT
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-32">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-16`}
              >
                {/* Content Side */}
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-purple-600 text-1xl font-bold text-purple-600 shadow-lg">
                    Step {step.step}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Visual Side */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-2xl border-4 border-indigo-200">
                    <div className="bg-gray-900 rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-white text-lg font-semibold">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section
        id="integrations"
        className="py-24 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Connect with your favorite platforms and publish content
              everywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 max-w-5xl mx-auto">
            {integrations.map((integration) => (
              <div
                key={integration}
                className="bg-white border-2 border-gray-200 hover:border-indigo-400 px-8 py-5 rounded-xl hover:shadow-xl hover:-translate-y-2 transition-all flex items-center justify-center min-w-[140px] group"
              >
                <span className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {integration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
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
                    ? "border-indigo-500 shadow-2xl scale-105"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-base mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-black text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 text-xl ml-2">
                      {plan.period}
                    </span>
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

                <a
                  href="/plans"
                  className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 block text-center ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  Start 7-Day Trial
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              All plans include a 7-day free trial. Cancel anytime, no questions
              asked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Outrank Your Competition?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
              Join thousands of content creators using AI to create
              SEO-optimized content that ranks.
            </p>
            <a
              href="/plans"
              className="inline-flex bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-5 rounded-full transition-all shadow-2xl hover:shadow-3xl hover:scale-105 items-center gap-2 text-lg"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
{/* 
    
      <footer className="border-t border-gray-200 py-16 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column 
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                  <img
                    src={logo}
                    alt="OutrankPilot Logo"
                    className="h-7 w-7 rounded-full"
                  />
                </div>
                <span className="text-2xl font-bold text-white">
                  OutrankPilot
                </span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                AI-powered SEO content generation platform helping businesses
                create content that ranks.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.linkedin.com/company/outrankpilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-gray-300" />
                </a>
                <a
                  href="https://x.com/outrankpilot?s=21&t=NZuy5fwcG-lAJ4--MYLKmw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-5 w-5 text-gray-300" />
                </a>

                <a
                  href="https://www.instagram.com/outrankpilot?igsh=NTE3NjJnNWRjdHl1&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                >
                  <Instagram className="h-5 w-5 text-gray-300" />
                </a>
              </div>
            </div>

            {/* Product Column 
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => scrollToSection(e, "#features")}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    onClick={(e) => scrollToSection(e, "#pricing")}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#integrations"
                    onClick={(e) => scrollToSection(e, "#integrations")}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="/plans"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Plans
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column 
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/blog"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/public-services"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Public Services
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => scrollToSection(e, "#how-it-works")}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="/affiliate-program"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Affiliate Program
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column 
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar 
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 OutrankPilot. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
                >
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer> 
    */}
    </div>
  );
}
