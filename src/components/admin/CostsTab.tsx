// CostsTab.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CostsTab() {
  const [costs, setCosts] = useState<any>({});
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.rpc("get_ai_cost_stats").then(({ data }) => {
      setCosts(data?.aggregate || {});
      setTopUsers(data?.top_users || []);
    });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-center p-6">
            <div>
              <div className="text-2xl font-bold">${costs.total_cost?.toFixed(2) || 0}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{costs.total_tokens || 0}</div>
              <div className="text-sm text-muted-foreground">Total Tokens</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Model breakdown */}
            <div className="space-y-2">
              {costs.by_model?.map((m: any) => (
                <div key={m.model} className="flex justify-between text-sm">
                  <span>{m.model}</span>
                  <Badge>${m.cost.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top AI Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.map((user: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="font-medium">{user.email}</span>
                <div className="text-right">
                  <div>{user.tokens} tokens</div>
                  <div className="text-sm text-muted-foreground">${user.cost.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
