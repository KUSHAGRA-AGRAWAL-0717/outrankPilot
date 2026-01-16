import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UsageStats {
  keywords_count: number;
  articles_published: number;
  active_projects: number;
}

interface TopUser {
  email: string;
  keywords_count: number;
  project_count: number;
  total_tokens: number;
}

export default function UsageTab() {
  const [usage, setUsage] = useState<UsageStats>({
    keywords_count: 0,
    articles_published: 0,
    active_projects: 0,
  });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_usage_stats");
    
    if (!error && data) {
      setUsage(data?.aggregate || {});
      setTopUsers(data?.top_users || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base text-[#5B6B8A]">Total Keywords Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold bg-gradient-to-r from-[#0B1F8A] to-[#1246C9] bg-clip-text text-transparent">
            {usage.keywords_count?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base text-[#5B6B8A]">Total Articles Published</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold bg-gradient-to-r from-[#0B1F8A] to-[#1246C9] bg-clip-text text-transparent">
            {usage.articles_published?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base text-[#5B6B8A]">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold bg-gradient-to-r from-[#0B1F8A] to-[#1246C9] bg-clip-text text-transparent">
            {usage.active_projects?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top 10 Users by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto grid grid-cols-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Keywords</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Projects</TableHead>
                  <TableHead className="text-right">AI Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length > 0 ? (
                  topUsers.map((user, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="text-right">{user.keywords_count?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{user.project_count || 0}</TableCell>
                      <TableCell className="text-right">{user.total_tokens?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[#5B6B8A]">
                      No usage data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
