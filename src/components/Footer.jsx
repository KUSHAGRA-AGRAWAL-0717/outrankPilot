import React from 'react'
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
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import logo from "../../public/logo2.jpeg";
const Footer = () => {
      const location = useLocation();
    const navigate = useNavigate();

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

  return (
    <div>
        <footer className="border-t border-gray-200 py-16 bg-gray-900">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Column */}
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
        
                    {/* Product Column */}
                    <div>
                      <h4 className="text-white font-bold text-lg mb-4">Product</h4>
                      <ul className="space-y-3">
                        <li>
                          <a
                            href="#features"
                            // onClick={(e) => scrollToSection(e, "#features")}
                            onClick={(e) => handleNav(e, "#features")}
                            className="text-gray-400 hover:text-indigo-400 transition-colors"
                          >
                            Features
                          </a>
                        </li>
                        <li>
                          <a
                            href="#pricing"
                            onClick={(e) => handleNav(e, "#pricing")}
                            className="text-gray-400 hover:text-indigo-400 transition-colors"
                          >
                            Pricing
                          </a>
                        </li>
                        <li>
                          <a
                            href="#integrations"
                            onClick={(e) => handleNav(e, "#integrations")}
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
        
                    {/* Resources Column */}
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
                            onClick={(e) => handleNav(e, "#how-it-works")}
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
        
                    {/* Company Column */}
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
                            href="/public-services"
                            className="text-gray-400 hover:text-indigo-400 transition-colors"
                          >
                            Terms of Service
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
        
                  {/* Bottom Bar */}
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
    </div>
  )
}

export default Footer