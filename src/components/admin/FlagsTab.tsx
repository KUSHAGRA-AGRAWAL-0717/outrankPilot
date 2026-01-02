// FlagsTab.tsx - UPDATED
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FlagsTab() {
  const [flags, setFlags] = useState<any[]>([]);
const [newFlag, setNewFlag] = useState({
  key: "",
  enabled: false,
  rollout_percentage: 100
});


  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("*")
      .then(({ data }) => setFlags(data || []));
  }, []);

  const toggleFlag = async (key: string, enabled: boolean) => {
    await supabase.from("feature_flags").update({ enabled: !enabled }).eq("key", key);
    setFlags(flags.map(f => f.key === key ? { ...f, enabled: !enabled } : f));
  };

  const addFlag = async () => {
    await supabase.from("feature_flags").insert(newFlag);
    setFlags([...flags, newFlag]);
    setNewFlag({ key: "", enabled: false, rollout_percentage: 100 });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Flag</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 items-end">
          <Input 
            placeholder="flag_name" 
            value={newFlag.key}
            onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
          />
          <Switch 
            checked={newFlag.enabled}
            onCheckedChange={(v) => setNewFlag({ ...newFlag, enabled: v })}
          />
          <Input 
            type="number" 
            value={newFlag.rollout_percentage}
            onChange={(e) => setNewFlag({ ...newFlag, rollout_percentage: Number(e.target.value) })}
            max={100}
          />
          <Button onClick={addFlag}>Add Flag</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {flags.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">{flag.key}</div>
              <div className="text-sm text-muted-foreground">
                Rollout: {flag.rollout_percentage}%
              </div>
            </div>
            <Switch 
              checked={flag.enabled}
              onCheckedChange={() => toggleFlag(flag.key, flag.enabled)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
