import { useState, useEffect } from "react";
import {
  Zap,
  Clock,
  BookOpen,
  Pause,
  Play,
  Loader2,
  CheckCircle2,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@headlessui/react";
import { countryOptions, languageOptions } from "@/hooks/locate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import logo from "../../public/logo2.jpeg";

export default function Autopilot() {
  const { currentProject, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [autoPublishAllowed, setAutoPublishAllowed] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [autopilotTime, setAutopilotTime] = useState("09:00");
  const [paused, setPaused] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(1);
  
  // Notion credentials
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [showNotionToken, setShowNotionToken] = useState(false);
  
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [langQuery, setLangQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [wpConfigured, setWpConfigured] = useState(false);
  const [notionConfigured, setNotionConfigured] = useState(false);
  const [testingAutopilot, setTestingAutopilot] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [currentProject]);

  const loadSettings = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    try {
      // Subscription check
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, auto_publish")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .maybeSingle();

      setAutoPublishAllowed(!!(subscription?.auto_publish));

      // Project settings
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", currentProject.id)
        .single();

      if (project) {
        setAutopilotEnabled(project.autopilot_enabled || false);
        setAutopilotTime(project.autopilot_time || "09:00");
        setPaused(project.paused || false);
        setDailyLimit(project.daily_publish_limit || 1);
        setLanguage(project.language_code || "en");
        setCountry(project.country_code || "US");
        setNotionDatabaseId(project.notion_database_id || "");
        setNotionToken(project.notion_token || "");
        
        // Check configurations
        setWpConfigured(!!(project.wp_url && project.wp_username && project.wp_app_password));
        setNotionConfigured(!!(project.notion_database_id && project.notion_token));
      }
    } catch (error) {
      console.error("Error loading autopilot settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotionCredentials = async () => {
    if (!currentProject) return;

    if (!notionDatabaseId.trim() || !notionToken.trim()) {
      toast.error("Please enter both Notion Database ID and Integration Token");
      return;
    }

    try {
      await supabase
        .from("projects")
        .update({ 
          notion_database_id: notionDatabaseId.trim(),
          notion_token: notionToken.trim()
        })
        .eq("id", currentProject.id);

      setNotionConfigured(true);
      toast.success("✅ Notion credentials saved!");
    } catch (error) {
      console.error("Error saving Notion credentials:", error);
      toast.error("Failed to save Notion credentials");
    }
  };

  const toggleAutopilot = async (enabled: boolean) => {
    if (!currentProject) return;

    if (enabled && !autoPublishAllowed) {
      toast.error("Upgrade plan for autopilot");
      return;
    }

    // Check if WordPress is configured (from Integrations tab)
    if (enabled && !wpConfigured && !notionConfigured) {
      toast.error("Please configure at least one publishing target. WordPress credentials should be set in the Integrations tab.");
      return;
    }

    try {
      await supabase
        .from("projects")
        .update({
          autopilot_enabled: enabled,
          autopilot_time: autopilotTime,
          paused: false,
        })
        .eq("id", currentProject.id);

      setAutopilotEnabled(enabled);
      toast.success(enabled ? "🚀 Autopilot activated! Briefs will publish every minute starting at " + autopilotTime + " UTC" : "⏹️ Autopilot disabled");
    } catch (error) {
      toast.error("Failed to update autopilot");
    }
  };

  const testAutopilotRun = async () => {
    if (!currentProject) return;

    setTestingAutopilot(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("autopilot", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Autopilot test failed");
      }

      const result = response.data;
      
      if (result.success && result.results && result.results.length > 0) {
        const published = result.results.filter((r: any) => r.status === "published").length;
        const skipped = result.results.filter((r: any) => r.status === "skipped").length;
        
        toast.success(`✅ Test completed! Published: ${published}, Skipped: ${skipped}`, {
          description: result.results.map((r: any) => 
            `Project ${r.projectId}: ${r.status}${r.briefTitle ? ` - "${r.briefTitle}"` : ''}`
          ).join('\n')
        });
      } else {
        toast.info("No briefs were published. Check if there are 'generated' briefs available.");
      }
    } catch (error: any) {
      console.error("Autopilot test error:", error);
      toast.error(error.message || "Failed to run autopilot test");
    } finally {
      setTestingAutopilot(false);
    }
  };

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

  const togglePause = async () => {
    await supabase
      .from("projects")
      .update({ paused: !paused })
      .eq("id", currentProject.id);

    setPaused(!paused);
    toast.success(paused ? "▶️ Autopilot resumed" : "⏸️ Autopilot paused");
  };

  const updateDailyLimit = async (limit: number) => {
    await supabase
      .from("projects")
      .update({ daily_publish_limit: limit })
      .eq("id", currentProject.id);

    setDailyLimit(limit);
    toast.success("Daily limit updated");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  const canEnableAutopilot = wpConfigured || notionConfigured;

  return (
    <div className="max-w-4xl space-y-6 bg-[#F6F8FC] p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3EF0C1] to-[#1B64F2]">
          <img src={logo} alt="OutrankPilot Logo" className="rounded-full" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0B1F3B] to-[#1B64F2] bg-clip-text text-transparent">
            Autopilot
          </h1>
          <p className="text-[#5B6B8A]">
            Automatically publish generated content briefs every minute
          </p>
        </div>
      </div>

      {!autoPublishAllowed && (
        <div className="rounded-2xl border border-[#FFD84D]/50 bg-gradient-to-r from-[#FFD84D]/10 to-[#F6F8FC]/50 p-8 text-center">
          <Zap className="mx-auto h-16 w-16 text-[#FFD84D] mb-4" />
          <h2 className="text-2xl font-bold text-[#0B1F3B] mb-2">
            Upgrade for Autopilot
          </h2>
          <p className="text-[#5B6B8A] mb-6 max-w-md mx-auto">
            Unlock automatic publishing with paid plans. Briefs publish every minute without lifting a finger.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-[#FFD84D] to-[#F5C842] text-[#0B1F3B] text-lg px-8">
            Upgrade Plan
          </Button>
        </div>
      )}

      {autoPublishAllowed && (
        <>
          {/* Configuration Warning */}
          {!canEnableAutopilot && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  Publishing Target Required
                </h3>
                <p className="text-sm text-orange-700">
                  {!wpConfigured && "Configure WordPress in the Integrations tab or "}
                  {!notionConfigured && "configure Notion below "}
                  to enable Autopilot. It will automatically publish briefs with "generated" status every minute.
                </p>
              </div>
            </div>
          )}

          {/* Publishing Integrations */}
          <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-6 flex items-center gap-2">
              🔗 Publishing Integrations
            </h3>

            {/* WordPress Status */}
            <div className="mb-6 p-4 bg-[#F6F8FC]/50 rounded-xl border border-[#8A94B3]/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#0B1F3B]">WordPress</p>
                  <p className="text-sm text-[#5B6B8A]">
                    {wpConfigured ? "✓ Ready to auto-publish" : "Not configured - set in Integrations tab"}
                  </p>
                </div>
              </div>
              <Badge className={wpConfigured ? "bg-green-500" : "bg-gray-400"}>
                {wpConfigured ? "✓ Active" : "Not Set"}
              </Badge>
            </div>

            {/* Notion Integration */}
            <div className="p-4 border border-[#8A94B3]/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0B1F3B]">Notion</p>
                    <p className="text-sm text-[#5B6B8A]">
                      {notionConfigured ? "✓ Ready to auto-publish" : "Enter credentials to enable"}
                    </p>
                  </div>
                </div>
                <Badge className={notionConfigured ? "bg-purple-500" : "bg-gray-400"}>
                  {notionConfigured ? "✓ Active" : "Not Set"}
                </Badge>
              </div>

              {/* Notion Configuration */}
              <div className="space-y-3 pt-4 border-t border-[#8A94B3]/20">
                {/* Integration Token */}
                <div>
                  <label className="block text-sm font-medium text-[#0B1F3B] mb-2">
                    Notion Integration Token <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNotionToken ? "text" : "password"}
                      value={notionToken}
                      onChange={(e) => setNotionToken(e.target.value)}
                      placeholder="secret_xxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNotionToken(!showNotionToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNotionToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Database ID */}
                <div>
                  <label className="block text-sm font-medium text-[#0B1F3B] mb-2">
                    Notion Database ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    placeholder="2e428d3dffaf8090b203000ca31462d1"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-[#8A94B3] mt-1">
                    Copy from Notion URL: notion.so/workspace/<strong className="bg-yellow-200">DATABASE_ID</strong>?v=...
                  </p>
                </div>

                <Button onClick={saveNotionCredentials} className="w-full">
                  Save Notion Credentials
                </Button>

                <div className="text-xs text-[#8A94B3] p-3 bg-purple-50 rounded-lg">
                  <p className="font-semibold mb-1">📚 Quick Setup:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" className="text-purple-600 underline">notion.so/my-integrations</a></li>
                    <li>Create new integration & copy token</li>
                    <li>Open database → "..." → Add your integration</li>
                    <li>Copy database ID from URL & paste above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Main Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Autopilot Toggle */}
            <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3B] mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#3EF0C1]" />
                    Enable Autopilot
                  </h3>
                  <p className="text-[#5B6B8A] text-sm">
                    Publish "generated" briefs every minute
                  </p>
                </div>
                <Switch
                  checked={autopilotEnabled}
                  onCheckedChange={toggleAutopilot}
                  disabled={!canEnableAutopilot}
                  className="data-[state=checked]:bg-[#3EF0C1]"
                />
              </div>

              {autopilotEnabled && (
                <div className="space-y-4">
                  {/* Pause/Resume */}
                  <div className="flex items-center justify-between p-4 bg-[#F6F8FC]/50 rounded-xl border border-[#8A94B3]/20">
                    <div>
                      <p className="font-semibold text-[#0B1F3B]">
                        {paused ? "⏸️ Paused" : "▶️ Running"}
                      </p>
                      <p className="text-sm text-[#5B6B8A]">
                        {paused ? "Click to resume" : "Click to pause"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePause}
                      className="gap-2 h-10"
                    >
                      {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {paused ? "Resume" : "Pause"}
                    </Button>
                  </div>

                  {/* Publish Time */}
                  <div className="p-4 bg-white/50 rounded-xl border border-[#8A94B3]/20">
                    <label className="block text-sm font-medium text-[#0B1F3B] mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time (UTC)
                    </label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="time"
                        value={autopilotTime}
                        onChange={(e) => setAutopilotTime(e.target.value)}
                        className="flex-1 h-12"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase
                            .from("projects")
                            .update({ autopilot_time: autopilotTime })
                            .eq("id", currentProject.id);
                          toast.success("Time saved");
                        }}
                        className="h-12 px-6"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-[#8A94B3] mt-2">
                      Publishing starts at this hour and continues every minute until daily limit is reached
                    </p>
                  </div>

                  {/* Test Autopilot Button */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-900 mb-3 font-medium">
                      🧪 Test your configuration now
                    </p>
                    <Button
                      onClick={testAutopilotRun}
                      disabled={testingAutopilot}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {testingAutopilot ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Test Autopilot Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Limit */}
            <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
              <h3 className="text-xl font-bold text-[#0B1F3B] mb-6 flex items-center gap-2">
                📊 Daily Limit
              </h3>
              <div className="space-y-3">
                {[1, 3, 5, 10, 20].map((limit) => (
                  <Button
                    key={limit}
                    variant={dailyLimit === limit ? "default" : "outline"}
                    className={`w-full justify-between h-14 ${
                      dailyLimit === limit
                        ? "bg-[#3EF0C1] text-white shadow-lg"
                        : "border-[#8A94B3]/30 hover:bg-[#F6F8FC]"
                    }`}
                    onClick={() => updateDailyLimit(limit)}
                  >
                    <span>{limit} briefs / day</span>
                    {dailyLimit === limit && <CheckCircle2 className="h-5 w-5" />}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-[#8A94B3] mt-4 text-center">
                Maximum briefs to auto-publish per day (one per minute)
              </p>
            </div>
          </div>

          {/* Language & Country */}
          <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-6">🌍 Regional Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Language */}
              <Combobox
                value={language}
                onChange={async (val) => {
                  setLanguage(val);
                  await supabase
                    .from("projects")
                    .update({ language_code: val })
                    .eq("id", currentProject.id);
                }}
              >
                <div className="relative">
                  <label className="text-sm font-medium text-[#0B1F3B] flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </label>
                  <Combobox.Input
                    className="w-full p-3 rounded-xl border border-[#8A94B3]/30 bg-white text-black"
                    displayValue={(code) =>
                      languageOptions.find((l) => l.code === code)?.name || ""
                    }
                    onChange={(e) => setLangQuery(e.target.value)}
                    placeholder="Select Language"
                  />
                  <Combobox.Options className="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow max-h-60 overflow-auto">
                    {filteredLanguages.map((lang) => (
                      <Combobox.Option
                        key={lang.code}
                        value={lang.code}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {lang.name}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>

              {/* Country */}
              <Combobox
                value={country}
                onChange={async (val) => {
                  setCountry(val);
                  await supabase
                    .from("projects")
                    .update({ country_code: val })
                    .eq("id", currentProject.id);
                }}
              >
                <div className="relative">
                  <label className="text-sm font-medium text-[#0B1F3B] flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    Country
                  </label>
                  <Combobox.Input
                    className="w-full p-3 rounded-xl border border-[#8A94B3]/30 bg-white text-black"
                    displayValue={(code) =>
                      countryOptions.find((c) => c.code === code)?.name || ""
                    }
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Select Country"
                  />
                  <Combobox.Options className="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow max-h-60 overflow-auto">
                    {filteredCountries.map((c) => (
                      <Combobox.Option
                        key={c.code}
                        value={c.code}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {c.name}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-[#8A94B3]/30 bg-gradient-to-r from-[#F6F8FC] to-white p-8">
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-6 flex items-center gap-2">
              🎯 How Autopilot Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                "Starts at your chosen hour (UTC)",
                "Publishes 1 brief per minute",
                "Continues until daily limit reached",
                "Updates status to 'published'",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-white/50 rounded-xl border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#3EF0C1]/20 border-2 border-[#3EF0C1]/40 flex items-center justify-center mt-0.5">
                    <span className="font-bold text-[#3EF0C1] text-sm">{i + 1}</span>
                  </div>
                  <p className="text-[#0B1F3B] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}