import { useState, useEffect } from "react";
import {
  Globe,
  Key,
  User,
  Bell,
  Save,
  Check,
  Zap,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

const tabs = [
  { id: "wordpress", label: "WordPress", icon: Globe },
  { id: "autopilot", label: "Autopilot", icon: Zap },
  { id: "account", label: "Account", icon: User },
  { id: "api", label: "API Keys", icon: Key }
];

export default function Settings() {
  const { currentProject } = useApp();

  const [autoPublishAllowed, setAutoPublishAllowed] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("wordpress");
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [autopilotTime, setAutopilotTime] = useState("09:00");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(1);

  /* ---------------- Subscription check ---------------- */
  useEffect(() => {
    const loadSubscription = async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, auto_publish")
        .eq("user_id", currentProject?.user_id)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        setAutoPublishAllowed(false);
        return;
      }

      setAutoPublishAllowed(
        data.status === "active" && data.auto_publish === true
      );
    };

    loadSubscription();
  }, [currentProject]);

  /* ---------------- Load project settings ---------------- */
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentProject) {
        setLoading(false);
        return;
      }

      try {
        const { data: project, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", currentProject.id)
          .single();

        if (error) throw error;

        if (project) {
          setWpUrl(project.wp_url || "");
          setWpUsername(project.wp_username || "");
          setWpPassword(project.wp_app_password || "");
          setConnected(
            !!(project.wp_url && project.wp_username && project.wp_app_password)
          );
          setAutopilotEnabled(project.autopilot_enabled || false);
          setAutopilotTime(project.autopilot_time || "09:00");
          setLanguage(project.language_code || "en");
          setCountry(project.country_code || "US");
          setPaused(project.paused || false);
          setDailyLimit(project.daily_publish_limit || 1);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentProject]);

  /* ---------------- Early loading UI ---------------- */
  if (loading || autoPublishAllowed === null) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  /* ---------------- Handlers ---------------- */
  const handleSaveWordPress = async () => {
    if (!currentProject) {
      toast.error("Please select a project first");
      return;
    }

    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error("Please fill in all fields");
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
      toast.success("WordPress connected successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save WordPress settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentProject) return;

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

  const handleSaveAutopilotTime = async () => {
    if (!currentProject) return;

    await supabase
      .from("projects")
      .update({
        autopilot_time: autopilotTime,
      })
      .eq("id", currentProject.id);

    toast.success("Autopilot time saved");
  };

  const handleToggleAutopilot = async (enabled: boolean) => {
    if (!currentProject) return;

    if (enabled) {
      if (!autoPublishAllowed) {
        toast.error("Your plan does not allow autopilot publishing");
        return;
      }

      if (!connected) {
        toast.error("Connect WordPress before enabling autopilot");
        return;
      }
    }

    await supabase
      .from("projects")
      .update({
        autopilot_enabled: enabled,
        autopilot_time: autopilotTime,
        paused: false,
      })
      .eq("id", currentProject.id);

    setAutopilotEnabled(enabled);
    toast.success(enabled ? "Autopilot enabled!" : "Autopilot disabled");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6 dark">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and integrations
          </p>
        </div>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-48 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-card">
            {activeTab === "wordpress" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      WordPress Integration
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your WordPress site for one-click publishing
                    </p>
                  </div>
                </div>

                {connected ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Connected to WordPress
                        </p>
                        <p className="text-sm text-muted-foreground">{wpUrl}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Language
                      </label>
                      <select
                        className="w-full rounded-md border border-border bg-background p-3 text-sm"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="hi">Hindi</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Country/Region
                      </label>
                      <select
                        className="w-full rounded-md border border-border bg-background p-3 text-sm"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option value="US">United States</option>
                        <option value="IN">India</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Site URL
                      </label>
                      <Input
                        placeholder="https://yourdomain.com"
                        value={wpUrl}
                        onChange={(e) => setWpUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Username
                      </label>
                      <Input
                        placeholder="admin"
                        value={wpUsername}
                        onChange={(e) => setWpUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Application Password
                      </label>
                      <Input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={wpPassword}
                        onChange={(e) => setWpPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Create in WordPress: Users → Profile → Application Passwords
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSaveWordPress}
                      disabled={saving || !currentProject}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? "Connecting..." : "Connect WordPress"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "autopilot" && !autoPublishAllowed && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-950/20">
                <Zap className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Autopilot Upgrade Required
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your current plan doesn't include autopilot publishing. Upgrade to unlock
                  automatic daily content publishing.
                </p>
              </div>
            )}

            {activeTab === "autopilot" && autoPublishAllowed && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Zap className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">
                        Autopilot Publishing
                      </h2>
                      {autopilotEnabled ? (
                        <Badge className="bg-green-600 text-white">Autopilot Active</Badge>
                      ) : (
                        <Badge variant="secondary">Autopilot Off</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Runs automatically via background cron jobs
                    </p>
                  </div>
                </div>

                {!connected ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      ⚠️ Please connect WordPress first before enabling Autopilot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-semibold text-foreground">Enable Daily Publishing</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically publish one generated brief daily as a draft
                        </p>
                      </div>
                      <Switch
                        checked={autopilotEnabled}
                        onCheckedChange={handleToggleAutopilot}
                        disabled={!connected}
                      />
                    </div>

                    {/* Pause/Resume Button */}
                    {autopilotEnabled && (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {paused ? "Autopilot Paused" : "Autopilot Running"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {paused 
                              ? "Resume to continue automatic publishing" 
                              : "Pause to temporarily stop publishing"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await supabase
                              .from("projects")
                              .update({ paused: !paused })
                              .eq("id", currentProject.id);

                            setPaused(!paused);
                            toast.success(paused ? "Autopilot resumed" : "Autopilot paused");
                          }}
                        >
                          {paused ? "Resume Autopilot" : "Pause Autopilot"}
                        </Button>
                      </div>
                    )}

                    {/* Daily Limit */}
                    {autopilotEnabled && (
                      <div className="space-y-2 rounded-lg border p-4">
                        <label className="text-sm font-medium text-foreground">
                          Daily Publish Limit
                        </label>
                        <select
                          className="w-full rounded-md border border-border bg-background p-2 text-sm"
                          value={dailyLimit}
                          onChange={async (e) => {
                            const value = Number(e.target.value);
                            setDailyLimit(value);
                            await supabase
                              .from("projects")
                              .update({ daily_publish_limit: value })
                              .eq("id", currentProject.id);
                            toast.success("Daily limit updated");
                          }}
                        >
                          <option value={1}>1 / day</option>
                          <option value={3}>3 / day</option>
                          <option value={5}>5 / day</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Maximum number of briefs to publish per day
                        </p>
                      </div>
                    )}

                    {/* Publish Time */}
                    {autopilotEnabled && (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <label className="text-sm font-medium text-foreground block">
                          Publish Time (UTC)
                        </label>
                        <div className="flex gap-3 items-end">
                          <Input
                            type="time"
                            value={autopilotTime}
                            onChange={(e) => setAutopilotTime(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveAutopilotTime}
                          >
                            Save Time
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Content will be published as drafts at this time daily (UTC)
                        </p>
                      </div>
                    )}

                    {/* How It Works */}
                    <div className="rounded-lg bg-secondary/50 p-4 border">
                      <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        How Autopilot Works
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Runs automatically via background worker</li>
                        <li>• Preferred publish time is respected when possible</li>
                        <li>• Picks unpublished generated brief</li>
                        <li>• Creates WordPress draft automatically</li>
                        <li>• Review & publish when ready</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your profile and preferences
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input placeholder="john@example.com" type="email" />
                  </div>
                  <Button className="w-full" variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Key className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your API integrations
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">OpenAI API Key</p>
                        <p className="text-sm text-muted-foreground">For AI content generation</p>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Configured</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">SERP API Key</p>
                        <p className="text-sm text-muted-foreground">For keyword rankings (optional)</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                    <Bell className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure how you receive updates
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Brief completed", description: "When a content brief is ready" },
                    {
                      label: "Content published",
                      description: "When content is published to WordPress",
                    },
                    { label: "Weekly digest", description: "Summary of your content performance" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}