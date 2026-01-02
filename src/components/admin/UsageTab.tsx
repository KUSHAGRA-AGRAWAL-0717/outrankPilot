// UsageTab.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsageTab() {
  const [usage, setUsage] = useState<any>({});
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.rpc("get_usage_stats").then(({ data }) => {
      setUsage(data?.aggregate || {});
      setTopUsers(data?.top_users || []);
    });
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Keywords Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{usage.keywords_count}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Articles Published</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{usage.articles_published}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{usage.active_projects}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top 10 Users by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th>User</th>
                  <th>Keywords</th>
                  <th>Projects</th>
                  <th>AI Tokens</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user, i) => (
                  <tr key={i} className="border-b">
                    <td>{user.email}</td>
                    <td>{user.keywords_count}</td>
                    <td>{user.project_count}</td>
                    <td>{user.total_tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
