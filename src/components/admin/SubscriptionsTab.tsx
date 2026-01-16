import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  keywords_limit: number;
  projects_limit: number;
  articles_limit: number;
  auto_publish: boolean;
  ai_images: boolean;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export default function SubscriptionsTab() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profiles(email, full_name)
      `)
      .order("plan", { ascending: false });

    if (!error && data) {
      setSubs(data as Subscription[]);
    }
    setLoading(false);
  };

  const overridePlan = async (subId: string, plan: string) => {
    const limits = {
      free: { keywords: 5, projects: 1, articles: 3 },
      pro: { keywords: 50, projects: 5, articles: 30 },
      enterprise: { keywords: 500, projects: 20, articles: 200 },
    };

    const limit = limits[plan as keyof typeof limits];

    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        plan, 
        status: "active",
        keywords_limit: limit.keywords,
        projects_limit: limit.projects,
        articles_limit: limit.articles,
      })
      .eq("id", subId);

    if (!error) {
      fetchSubscriptions();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1246C9] mx-auto"></div>
          <p className="mt-2 text-[#5B6B8A]">Loading subscriptions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {subs.map((sub) => (
        <Card key={sub.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base truncate">
                  {sub.profiles?.email}
                </CardTitle>
                {sub.profiles?.full_name && (
                  <p className="text-sm text-[#5B6B8A] mt-1">{sub.profiles.full_name}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Badge 
                variant="default"
                className="bg-[#FFD84D] text-[#0B1F3B] capitalize"
              >
                {sub.plan}
              </Badge>
              <Badge variant={sub.status === "active" ? "outline" : "secondary"}>
                {sub.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm bg-[#F6F8FC] p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-[#5B6B8A]">Keywords:</span>
                <span className="font-medium">{sub.keywords_limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B8A]">Projects:</span>
                <span className="font-medium">{sub.projects_limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6B8A]">Articles:</span>
                <span className="font-medium">{sub.articles_limit}</span>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              {sub.auto_publish && (
                <Badge variant="secondary">Auto Publish</Badge>
              )}
              {sub.ai_images && (
                <Badge variant="secondary">AI Images</Badge>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => overridePlan(sub.id, "pro")}
                variant="outline"
                className="flex-1"
              >
                Set Pro
              </Button>
              <Button 
                size="sm" 
                onClick={() => overridePlan(sub.id, "enterprise")}
                variant="outline"
                className="flex-1"
              >
                Set Enterprise
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
