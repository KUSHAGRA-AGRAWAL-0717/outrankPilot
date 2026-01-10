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
import ConnectNotion from "@/components/ConnectNotion";
import logo from "../../public/logo2.jpeg";

export default function Autopilot() {
  const { currentProject, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [autoPublishAllowed, setAutoPublishAllowed] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [autopilotTime, setAutopilotTime] = useState("09:00");
  const [paused, setPaused] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(1);
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [langQuery, setLangQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

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
      }

      // Notion connection
      const { data: notion } = await supabase
        .from("notion_accounts")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();
      setNotionConnected(!!notion);
    } catch (error) {
      console.error("Error loading autopilot settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutopilot = async (enabled: boolean) => {
    if (!currentProject) return;

    if (enabled && !autoPublishAllowed) {
      toast.error("Upgrade plan for autopilot");
      return;
    }

    try {
      await supabase
        .from("projects")
        .update({
          autopilot_enabled: enabled,
          autopilot_time,
          paused: false,
        })
        .eq("id", currentProject.id);

      setAutopilotEnabled(enabled);
      toast.success(enabled ? "🚀 Autopilot activated!" : "⏹️ Autopilot disabled");
    } catch (error) {
      toast.error("Failed to update autopilot");
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

  const saveNotionDatabase = async () => {
    if (!notionDatabaseId.trim()) {
      toast.error("Please enter a database ID");
      return;
    }

    try {
      await supabase
        .from("projects")
        .update({ notion_database_id: notionDatabaseId })
        .eq("id", currentProject.id);

      toast.success("Notion database saved");
    } catch (error) {
      toast.error("Failed to save database ID");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

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
            Set it and forget it - automatic daily content publishing
          </p>
        </div>
      </div>

      {autoPublishAllowed && (
        <div className="rounded-2xl border border-[#FFD84D]/50 bg-gradient-to-r from-[#FFD84D]/10 to-[#F6F8FC]/50 p-8 text-center">
          <Zap className="mx-auto h-16 w-16 text-[#FFD84D] mb-4" />
          <h2 className="text-2xl font-bold text-[#0B1F3B] mb-2">
            Upgrade for Autopilot
          </h2>
          <p className="text-[#5B6B8A] mb-6 max-w-md mx-auto">
            Unlock automatic daily publishing with paid plans. Publish content without lifting a finger.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-[#FFD84D] to-[#F5C842] text-[#0B1F3B] text-lg px-8">
            Upgrade Plan
          </Button>
        </div>
      )}

      {!autoPublishAllowed && (
        <>
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
                  <p className="text-[#5B6B8A]">
                    Automatically publish generated briefs daily
                  </p>
                </div>
                <Switch
                  checked={autopilotEnabled}
                  onCheckedChange={toggleAutopilot}
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
                        {paused ? "Click to resume publishing" : "Click to pause temporarily"}
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
                      Publish Time (UTC)
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
                      Articles published around this time daily
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Limit */}
            <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
              <h3 className="text-xl font-bold text-[#0B1F3B] mb-6 flex items-center gap-2">
                📊 Daily Publishing
              </h3>
              <div className="space-y-3">
                {[1, 3, 5].map((limit) => (
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
                    <span>{limit} articles / day</span>
                    {dailyLimit === limit && <CheckCircle2 className="h-5 w-5" />}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-[#8A94B3] mt-4 text-center">
                Max articles autopilot can publish daily
              </p>
            </div>
          </div>

          {/* Publishing Integrations */}
          <div className="rounded-2xl border border-[#8A94B3]/30 bg-white p-8 shadow-xl">
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-6 flex items-center gap-2">
              🔗 Publishing Integrations
            </h3>

            {/* Notion Integration */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-6 border border-[#8A94B3]/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0B1F3B]">Notion</p>
                    <p className="text-sm text-[#5B6B8A]">
                      Auto-publish to Notion databases
                    </p>
                  </div>
                </div>
                {notionConnected ? (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Connected
                  </Badge>
                ) : (
                  <ConnectNotion projectId={currentProject?.id} />
                )}
              </div>

              {/* Notion Database ID */}
              {notionConnected && (
                <div className="p-6 bg-[#F6F8FC]/50 rounded-xl border border-[#8A94B3]/20">
                  <label className="block text-sm font-medium text-[#0B1F3B] mb-3">
                    Notion Database ID (Optional - for Autopilot)
                  </label>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      value={notionDatabaseId}
                      onChange={(e) => setNotionDatabaseId(e.target.value)}
                      placeholder="2e428d3dffaf8090b203000ca31462d1"
                      className="flex-1 font-mono text-sm"
                    />
                    <Button onClick={saveNotionDatabase}>Save</Button>
                  </div>
                  <p className="text-xs text-[#8A94B3] mt-2">
                    Get from Notion URL: notion.so/page?v=<strong>DATABASE_ID</strong>&pvs=13
                  </p>
                </div>
              )}
            </div>

            {/* Language & Country */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              {[
                "Checks ready briefs daily",
                "Publishes to WordPress & Notion",
                "Respects your time preference",
                "Stops at daily limit",
                "Real-time status updates",
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