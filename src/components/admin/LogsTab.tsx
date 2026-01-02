// LogsTab.tsx - UPDATED
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    supabase
      .from("audit_logs")
      .select("*, profiles!actor_id_fkey(email)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setLogs(data || []));
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.profiles?.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Logs (Last 100)</CardTitle>
          <Input 
            placeholder="Filter logs..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary">{log.action}</Badge>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm truncate">
                  {log.profiles?.email || "system"} → {log.target_id?.slice(0,8)}...
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
