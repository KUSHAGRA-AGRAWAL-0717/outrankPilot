import { useState, useEffect } from "react";
import {
  Globe,
  User,
  Key,
  Bell,
  Loader2,
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
import { countryOptions, languageOptions } from "../hooks/locate"
import { Combobox } from "@headlessui/react";

const tabs = [
  { id: "Integrations", label: "Integrations", icon: Globe },
  { id: "account", label: "Account", icon: User },
  { id: "api", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell }
];

export default function Settings() {
  const { currentProject, user } = useApp();
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
  }, [currentProject]);

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

    setWpUrl(""); setWpUsername(""); setWpPassword("");
    setConnected(false);
    toast.success("WordPress disconnected");
  };

  if (loading) {
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

        <div className="flex gap-6">
          {/* Simplified Tabs */}
          <div className="w-48 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1B64F2]/10 text-[#1B64F2] shadow-md"
                    : "text-[#5B6B8A] hover:bg-[#F6F8FC] hover:text-[#0B1F3B]"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

         {activeTab === "Integrations" && (
  <div className="text-black shadow-md">
    <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">Integrations</h2>
    <IntegrationsDashboard projectId={currentProject?.id} user={user} />

  </div>
)}


          {/* Other tabs remain minimal */}
          {activeTab === "account" && (
            <div className="flex-1 p-8 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-[#0B1F3B] mb-6">Account Settings</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Full Name</label>
                  <Input placeholder="Your name" />
                </div>
                <Button className="w-full" variant="outline">Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="flex-1 p-8 rounded-xl border border-[#8A94B3]/30 shadow-sm">
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
        </div>
      </div>
  );
}
