// WhiteLabelTab.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function WhiteLabelTab() {
  const [settings, setSettings] = useState({
    custom_logo: "",
    primary_color: "#3b82f6",
    custom_domain: "",
    hide_branding: false,
    enabled: false
  });

  useEffect(() => {
    // Load white-label settings from feature_flags or config table
    supabase.from("feature_flags").select("*").eq("key", "whitelabel").then(({ data }) => {
      if (data?.[0]) setSettings(data[0] as any);
    });
  }, []);

  const saveSettings = async () => {
    await supabase.from("feature_flags").upsert({
  key: "whitelabel",
  enabled: settings.enabled,
  rollout_percentage: 100,
  meta: settings
});

  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>White-label Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label>Custom Logo URL</label>
              <Input 
                value={settings.custom_logo}
                onChange={(e) => setSettings({ ...settings, custom_logo: e.target.value })}
              />
            </div>
            
            <div>
              <label>Primary Color</label>
              <Input 
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
              />
            </div>

            <div>
              <label>Custom Domain</label>
              <Input 
                value={settings.custom_domain}
                onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Hide Outrank Branding</span>
              <Switch 
                checked={settings.hide_branding}
                onCheckedChange={(v) => setSettings({ ...settings, hide_branding: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Enable White-label</span>
              <Switch 
                checked={settings.enabled}
                onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
              />
            </div>
          </div>
        </div>

        <Button onClick={saveSettings} className="w-full">
          Save White-label Settings
        </Button>
      </CardContent>
    </Card>
  );
}
