import { useState, useEffect } from "react";
import {
  Globe,
  User,
  Key,
  Bell,
  Loader2,
  DollarSign,
  Crown,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ConnectWordPress from "@/components/ConnectWordPress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import IntegrationsDashboard from "@/components/IntegrationsDashboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { countryOptions, languageOptions } from "../hooks/locate";
import { Combobox } from "@headlessui/react";
import RefundRequest from "@/components/RefundRequest";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Link } from "react-router-dom";

const tabs = [
  { id: "Integrations", label: "Integrations", icon: Globe },
  { id: "account", label: "Account", icon: User },
  { id: "api", label: "API Keys", icon: Key },
  { id: "wordpress", label: "WordPress", icon: Bell },
  { id: "refund", label: "Request Refund", icon: DollarSign },
];

export default function Settings() {
  const { currentProject, user } = useApp();
  const { access, loading: accessLoading } = useFeatureAccess();
  const [activeTab, setActiveTab] = useState("wordpress");
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [langQuery, setLangQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [subscription, setSubscription] = useState(null);

  const filteredLanguages =
    langQuery === ""
      ? languageOptions
      : languageOptions.filter((l) =>
          l.name.toLowerCase().includes(langQuery.toLowerCase())
        );

  const filteredCountries =
    countryQuery === ""
      ? countryOptions
      : countryOptions.filter((c) =>
          c.name.toLowerCase().includes(countryQuery.toLowerCase())
        );

  useEffect(() => {
    loadSettings();
    loadSubscription();
  }, [currentProject, user]);

  const loadSettings = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", currentProject.id)
        .single();

      if (project) {
        setWpUrl(project.wp_url || "");
        setWpUsername(project.wp_username || "");
        setWpPassword(project.wp_app_password || "");
        setConnected(!!(project.wp_url && project.wp_username && project.wp_app_password));
        setLanguage(project.language_code || "en");
        setCountry(project.country_code || "US");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSubscription(data);
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
  };

  const handleSaveWordPress = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          wp_url: wpUrl,
          wp_username: wpUsername,
          wp_app_password: wpPassword,
          language_code: language,
          country_code: country,
        })
        .eq("id", currentProject.id);

      if (error) throw error;
      
      setConnected(true);
      toast.success("✅ WordPress connected!");
    } catch (error) {
      toast.error("Failed to connect WordPress");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await supabase
      .from("projects")
      .update({
        wp_url: null,
        wp_username: null,
        wp_app_password: null,
      })
      .eq("id", currentProject.id);

    setWpUrl(""); 
    setWpUsername(""); 
    setWpPassword("");
    setConnected(false);
    toast.success("WordPress disconnected");
  };

  // Check if user can request refund
  const canRequestRefund = () => {
    if (!subscription) return false;
    if (!["active", "trialing"].includes(subscription.status)) return false;
    
    const startDate = subscription.subscription_start_at || subscription.trial_start_at;
    if (!startDate) return false;

    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceStart <= 7;
  };

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 bg-[#F6F8FC] min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Integrations & Settings</h1>
        <p className="text-[#5B6B8A]">Manage integrations and preferences</p>
      </div>

      {/* Subscription Status Banner */}
      {access && (
        <div className={`rounded-xl p-4 border-2 ${
          access.plan === "free" 
            ? "bg-yellow-50 border-yellow-300" 
            : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {access.plan === "free" ? (
                <Lock className="h-5 w-5 text-yellow-600" />
              ) : (
                <Crown className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="font-semibold text-black">
                 Current plan: {access.plan === "free" ? "Free" : `${access.plan.charAt(0).toUpperCase() + access.plan.slice(1)}`}
                </p>
                <p className="text-xs text-gray-600">
                  {access.plan === "free" 
                    ? "Upgrade to unlock all features" 
                    : subscription?.status === "trialing" 
                      ? `Trial ends ${new Date(subscription.trial_ends_at).toLocaleDateString()}`
                      : "All features unlocked"}
                </p>
              </div>
            </div>
            {access.plan === "free" && (
              <Link 
                to="/pricing"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Upgrade Now
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => {
            // Disable refund tab if not eligible
            const isRefundTab = tab.id === "refund";
            const isDisabled = isRefundTab && !canRequestRefund();

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed text-[#5B6B8A]"
                    : activeTab === tab.id
                    ? "bg-[#1B64F2]/10 text-[#1B64F2] shadow-md"
                    : "text-[#5B6B8A] hover:bg-[#F6F8FC] hover:text-[#0B1F3B]"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {isRefundTab && !canRequestRefund() && (
                  <Lock className="h-3 w-3 ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "Integrations" && (
            <div className="text-black shadow-md">
              <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">Integrations</h2>
              
              {/* Feature Lock for Free Users */}
              {access?.plan === "free" && (
                <div className="mb-6 p-6 rounded-xl border-2 border-yellow-300 bg-yellow-50">
                  <div className="flex items-start gap-4">
                    <Lock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-900 mb-2">
                        Premium Feature
                      </h3>
                      <p className="text-sm text-yellow-800 mb-4">
                        Notion integration is available on paid plans. Upgrade to automatically publish your content to Notion.
                      </p>
                      <Link 
                        to="/pricing"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        <Crown className="h-4 w-4" />
                        Upgrade to Access
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <IntegrationsDashboard 
                projectId={currentProject?.id} 
                user={user}
                access={access}
              />
            </div>
          )}

          {activeTab === "account" && (
            <div className="p-8 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">Account Settings</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Email</label>
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-gray-100 text-black" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Full Name</label>
                  <Input placeholder="Your name" className="bg-white text-black" />
                </div>
                
                {/* Current Plan Display */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2 text-black">Current Plan</label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold capitalize text-black">
                      {access?.plan || "Free"}
                    </span>
                    {access?.plan === "free" && (
                      <Link 
                        to="/pricing"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>

                <Button className="w-full" variant="outline">Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="p-8 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">API Keys</h2>
              <div className="space-y-4">
                <div className="p-6 rounded-xl border bg-[#3EF0C1]/10 text-black">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">OpenAI API Key</p>
                      <p className="text-sm text-black">Configured ✓</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wordpress" && (
            <div className="p-8 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">WordPress Integration</h2>
              
              {/* Feature Lock for Auto-Publish */}
              {access && !access.canAutoPublish && (
                <div className="mb-6 p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">
                        Auto-publishing is available on Grow and Premium plans
                      </p>
                      <Link 
                        to="/pricing"
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Upgrade to unlock →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <ConnectWordPress
                wpUrl={wpUrl}
                setWpUrl={setWpUrl}
                wpUsername={wpUsername}
                setWpUsername={setWpUsername}
                wpPassword={wpPassword}
                setWpPassword={setWpPassword}
                connected={connected}
                onSave={handleSaveWordPress}
                onDisconnect={handleDisconnect}
                saving={saving}
                language={language}
                setLanguage={setLanguage}
                country={country}
                setCountry={setCountry}
                filteredLanguages={filteredLanguages}
                langQuery={langQuery}
                setLangQuery={setLangQuery}
                filteredCountries={filteredCountries}
                countryQuery={countryQuery}
              />
            </div>
          )}

          {activeTab === "refund" && (
            <div className="rounded-xl">
              {canRequestRefund() ? (
                <RefundRequest subscription={subscription} />
              ) : (
                <div className="p-8 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm text-center">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Refund Not Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {!subscription 
                      ? "You don't have an active subscription."
                      : "Refunds are only available within 7 days of subscription."}
                  </p>
                  <Link 
                    to="/pricing"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
