import React from 'react'
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
            href: "/features#ai-autopilot",
          },
          {
            icon: Search,
            label: "Keyword Research",
            description: "Find high-value keywords with data-driven insights",
            href: "/features#keyword-research",
          },
          {
            icon: BarChart3,
            label: "SERP Analysis",
            description: "Analyze competitors and understand ranking factors",
            href: "/features#serp-analysis",
          },
          {
            icon: FileText,
            label: "AI Content Generator",
            description: "Create comprehensive content briefs in minutes",
            href: "/features#content-generator",
          },
          {
            icon: FileCode,
            label: "Content Planner",
            description: "Plan and schedule your content strategy",
            href: "/features#content-planner",
          },
          {
            icon: Globe,
            label: "WordPress Publishing",
            description: "One-click publishing to WordPress and more",
            href: "/features#wordpress-publishing",
          },
        ],
      },
    ],
    featured: {
      title: "Latest Feature",
      label: "AI Content Briefs",
      description:
        "Generate comprehensive 3,500+ word SEO-optimized content briefs powered by advanced AI technology.",
      href: "/features#ai-content",
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
const Navbar = () => {

    const [openDropdown, setOpenDropdown] = useState(null);
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const hoverTimeoutRef = useRef(null);
      const dropdownTimeoutRef = useRef(null);

      const location = useLocation();
const navigate = useNavigate();

    
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

    const handleNav = (e, href) => {
  if (!href) return;

  // normal route
  if (!href.startsWith("#")) {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    return;
  }

  e.preventDefault();
  const id = href.replace("#", "");

  // already on home
  if (location.pathname === "/") {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80,
        behavior: "smooth",
      });
    }
  } else {
    navigate(`/#${id}`);
  }

  setMobileMenuOpen(false);
  setOpenDropdown(null);
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
    
 <nav className="bg-purple-600 bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 sticky top-0 left-0 right-0 z-50 h-20">
    
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              {/* <Zap className="h-7 w-7 text-gray-900" /> */}
              <img
                src={logo}
                className="h-10 w-10 text-gray-900 rounded-full"
                alt="OutrankPilot Logo"
              />
            </div>
            <span className="text-2xl font-bold text-black">OutrankPilot</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className="text-black hover:text-yellow-300 transition-colors font-medium text-base flex items-center gap-1"
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                      />
                    </button>
                  </>
                ) : (
                  <a
                    href={item.href}
                    // onClick={(e) => scrollToSection(e, item.href)}
                    onClick={(e) => handleNav(e, item.href)}
                    className="text-black hover:text-yellow-300 transition-colors font-medium text-base"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Full-Screen Dropdown Overlay */}
          {openDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setOpenDropdown(null)}
              />

              {/* Dropdown Content */}
              <div className="fixed left-0 right-0 top-20 z-50 bg-white shadow-2xl">
                <div className="container mx-auto px-6 py-12">
                  {navigationItems
                    .filter((item) => item.label === openDropdown)
                    .map((item) => (
                      <div
                        key={item.label}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                      >
                        {/* Left Side - Main Features */}
                        <div className="lg:col-span-2">
                          {item.sections.map((section, idx) => (
                            <div key={idx}>
                              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b-2 border-yellow-400 inline-block">
                                {section.title}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {section.items.map((dropItem) => (
                                  <a
                                    key={dropItem.label}
                                    href={dropItem.href}
                                    onClick={(e) => {
                                      if (dropItem.href.startsWith("#")) {
                                        handleNav(e, dropItem.href);
                                      }
                                      setOpenDropdown(null);
                                    }}
                                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-indigo-50 transition-all group"
                                  >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                                      <dropItem.icon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-gray-900 font-semibold group-hover:text-indigo-600 transition-colors mb-1">
                                        {dropItem.label}
                                      </div>
                                      <div className="text-sm text-gray-600 leading-relaxed">
                                        {dropItem.description}
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Right Side - Featured */}
                        {item.featured && (
                          <div className="lg:col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b-2 border-yellow-400 inline-block">
                              {item.featured.title}
                            </h3>
                            <a
                              href={item.featured.href}
                              onClick={(e) => {
                                if (item.featured.href.startsWith("#")) {
                                  handleNav(e, item.featured.href);
                                }
                                setOpenDropdown(null);
                              }}
                              className="block mt-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 hover:shadow-2xl transition-all group"
                            >
                              <div className="text-6xl mb-4">
                                {item.featured.image}
                              </div>
                              <h4 className="text-xl font-bold text-white mb-3">
                                {item.featured.label}
                              </h4>
                              <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                                {item.featured.description}
                              </p>
                              <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                                Learn More
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="/auth"
              className="text-black hover:text-red-600 transition-colors font-medium"
            >
              Sign In
            </a>
            <a
              href="/auth"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="container mx-auto px-6 py-4">
              {navigationItems.map((item) => (
                <div
                  key={item.label}
                  className="py-2 border-b border-gray-100 last:border-0"
                >
                  {item.hasDropdown ? (
                    <>
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === item.label ? null : item.label,
                          )
                        }
                        className="flex items-center justify-between w-full text-gray-800 font-semibold py-3"
                      >
                        {item.label}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                        />
                      </button>
                      {openDropdown === item.label && (
                        <div className="pl-2 py-2 space-y-1">
                          {item.sections &&
                            item.sections[0].items.map((dropItem) => (
                              <a
                                key={dropItem.label}
                                href={dropItem.href}
                                onClick={(e) => {
                                  if (dropItem.href.startsWith("#")) {
                                    handleNav(e, dropItem.href);
                                  }
                                }}
                                className="flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 flex-shrink-0 mt-0.5">
                                  <dropItem.icon className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-gray-900 font-medium text-sm">
                                    {dropItem.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                                    {dropItem.description}
                                  </div>
                                </div>
                              </a>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => handleNav(e, item.href)}
                      className="block text-gray-800 font-semibold py-3"
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              ))}
              <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
                <a
                  href="/auth"
                  className="block w-full text-gray-700 font-semibold py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-center"
                >
                  Sign In
                </a>
                <a
                  href="/auth"
                  className="block w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-full transition-all shadow-lg text-center"
                >
                  Get Started Free
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

  )
}

export default Navbar