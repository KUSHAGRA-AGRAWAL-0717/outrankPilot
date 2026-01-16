import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CostStats {
  total_cost: number;
  total_tokens: number;
  by_model?: Array<{ model: string; cost: number; tokens: number }>;
}

interface TopUser {
  email: string;
  tokens: number;
  cost: number;
}

export default function CostsTab() {
  const [costs, setCosts] = useState<CostStats>({ total_cost: 0, total_tokens: 0 });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostStats();
  }, []);

  const fetchCostStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_ai_cost_stats");
    
    if (!error && data) {
      setCosts(data?.aggregate || { total_cost: 0, total_tokens: 0 });
      setTopUsers(data?.top_users || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>AI Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-center p-6">
            <div className="p-4 bg-[#F6F8FC] rounded-lg">
              <div className="text-3xl font-bold text-[#0B1F8A]">
                ${costs.total_cost?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-[#5B6B8A] mt-2">Total Spent</div>
            </div>
            <div className="p-4 bg-[#F6F8FC] rounded-lg">
              <div className="text-3xl font-bold text-[#0B1F8A]">
                {costs.total_tokens?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-[#5B6B8A] mt-2">Total Tokens</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costs.by_model && costs.by_model.length > 0 ? (
                costs.by_model.map((m) => (
                  <div key={m.model} className="flex justify-between items-center p-3 bg-[#F6F8FC] rounded-lg">
                    <div>
                      <span className="font-medium">{m.model}</span>
                      <div className="text-xs text-[#5B6B8A]">
                        {m.tokens?.toLocaleString() || 0} tokens
                      </div>
                    </div>
                    <Badge className="bg-[#FFD84D] text-[#0B1F3B]">
                      ${m.cost?.toFixed(2) || "0.00"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#5B6B8A] py-4">No model data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Top AI Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[#F6F8FC] rounded-lg hover:bg-[#eef1f8] transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{user.email}</span>
                    <span className="text-sm text-[#5B6B8A]">
                      {user.tokens?.toLocaleString() || 0} tokens
                    </span>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold text-[#0B1F8A]">
                      ${user.cost?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#5B6B8A] py-4">No user cost data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
