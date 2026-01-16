import {
  TrendingUp,
  FileText,
  Target,
  ArrowUpRight,
  Plus,
  Zap,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportProjectButtons from "../components/ExportProjectButtons";
import { useApp } from "@/contexts/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Brief {
  id: string;
  title: string;
  keyword: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { currentProject, user } = useApp();
  const navigate = useNavigate();
  const [projectStats, setProjectStats] = useState<any>(null);
  const [recentBriefs, setRecentBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user?.id)
        .single();
      
      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
      }
    };
    checkOnboarding();
  }, [user, navigate]);

  useEffect(() => {
    if (currentProject) {
      fetchDashboardData();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentProject]);

  const fetchDashboardData = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    
    try {
      // Fetch project stats (will be computed by edge function)
      const { data: statsData, error: statsError } = await supabase
        .from("project_stats")
        .select("*")
        .eq("project_id", currentProject.id)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error("Error fetching stats:", statsError);
      }

      // If no stats exist, trigger computation
      if (!statsData) {
        console.log("No stats found, will compute on next refresh");
        // You could trigger the edge function here if needed
      }

      setProjectStats(statsData);

      // Fetch recent briefs
      const { data: briefsData, error: briefsDataError } = await supabase
        .from("content_briefs")
        .select(`
          id, 
          title, 
          status, 
          created_at,
          keywords:keyword_id(keyword)
        `)
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (briefsDataError) {
        console.error("Error fetching briefs:", briefsDataError);
      } else if (briefsData) {
        setRecentBriefs(
          briefsData.map((b: any) => ({
            id: b.id,
            title: b.title,
            keyword: b.keywords?.keyword || "No keyword",
            status: b.status || "draft",
            createdAt: b.created_at,
          }))
        );
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    if (!currentProject) return;
    
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to refresh stats");
        return;
      }

      // First, track rankings for this project
      toast.info("Tracking keyword rankings...");
      const rankingsResponse = await supabase.functions.invoke('track-rankings', {
        body: { 
          project_id: currentProject.id,
          date: new Date().toISOString().split('T')[0]
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (rankingsResponse.error) {
        throw rankingsResponse.error;
      }

      // Then compute project stats
      toast.info("Computing project statistics...");
      const statsResponse = await supabase.functions.invoke('compute-project-stats', {
        body: { project_id: currentProject.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (statsResponse.error) {
        throw statsResponse.error;
      }

      // Refresh the dashboard data
      await fetchDashboardData();
      
      toast.success("Dashboard refreshed successfully!");
    } catch (error: any) {
      console.error("Refresh error:", error);
      toast.error(`Failed to refresh: ${error.message || "Unknown error"}`);
    } finally {
      setRefreshing(false);
    }
  };
  // Add this helper function above the stats array
const formatTraffic = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

  const stats = [
  {
    label: "Keywords Tracked",
    value: loading ? "..." : projectStats?.keyword_count ?? 0,
    icon: Target,
    change: "+12%",
    color: "bg-blue-500",
  },
  {
    label: "Avg. Position",
    value: loading
      ? "..."
      : projectStats?.avg_rank != null
      ? Number(projectStats.avg_rank).toFixed(1)
      : "N/A",
    icon: Zap,
    change: "+8%",
    color: "bg-purple-500",
  },
  {
    label: "Traffic Potential",
    // Format large numbers properly
    value: loading 
      ? "..." 
      : projectStats?.traffic_potential 
        ? formatTraffic(projectStats.traffic_potential)
        : "0",
    icon: TrendingUp,
    change: "+23%",
    color: "bg-green-500",
  },
  {
  label: "Health Score",
  value: loading
    ? "..."
    : projectStats?.health_score != null
    ? `${Math.round(Number(projectStats.health_score))}%`
    : "N/A",
  icon: TrendingUp,
  change: "+5%",
  color: "bg-orange-500",
},
];




  return (
    <div className="space-y-8 bg-[#F6F8FC] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3B]">Welcome back</h1>
          <p className="text-[#5B6B8A] mt-1">
            Here's what's happening with {currentProject?.name || "your project"}
          </p>
          {projectStats?.last_updated && (
            <p className="text-xs text-[#8A94B3] mt-1">
              Last updated: {new Date(projectStats.last_updated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={refreshStats}
            disabled={refreshing || !currentProject}
            className="bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </Button>
          <Link to="/keywords">
            <Button className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              New Brief
            </Button>
          </Link>
          <Button
            className="bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
            onClick={() => navigate("/competitor-analysis")}
          >
            <Globe className="h-4 w-4 mr-2" />
            Competitors
          </Button>
          {currentProject?.id && (
            <ExportProjectButtons projectId={currentProject.id} />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-xl border border-[#8A94B3]/30 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#1B64F2]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}/10`}>
                <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {/* Uncomment if you want to show change percentages */}
              {/* <div className="flex items-center gap-1 text-sm text-[#3EF0C1] font-medium">
                <ArrowUpRight className="h-3 w-3" />
                {stat.change}
              </div> */}
            </div>
            <p className="text-2xl font-bold text-[#0B1F3B]">{stat.value}</p>
            <p className="text-sm text-[#5B6B8A] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Briefs & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Briefs */}
        <div className="lg:col-span-2 rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#8A94B3]/30">
            <h2 className="text-lg font-semibold text-[#0B1F3B]">
              Recent Briefs
            </h2>
            <Link to="/briefs">
              <Button className="bg-transparent hover:bg-[#F6F8FC] text-[#1B64F2]">
                View All
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[#8A94B3]/30">
            {loading ? (
              <div className="p-6 text-center text-[#5B6B8A]">
                <div className="animate-pulse">Loading briefs...</div>
              </div>
            ) : recentBriefs.length === 0 ? (
              <div className="p-6 text-center text-[#5B6B8A]">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No briefs yet. Create your first brief!</p>
                <Link to="/keywords">
                  <Button className="mt-4 bg-[#1B64F2] hover:bg-[#1B64F2]/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Brief
                  </Button>
                </Link>
              </div>
            ) : (
              recentBriefs.map((brief) => (
                <Link
                  key={brief.id}
                  to={`/briefs/${brief.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[#F6F8FC]/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0B1F3B] truncate">
                      {brief.title}
                    </p>
                    <p className="text-sm text-[#5B6B8A] truncate">
                      {brief.keyword}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        brief.status === "published"
                          ? "bg-[#3EF0C1]/10 text-[#0B1F3B] border border-[#3EF0C1]/30"
                          : brief.status === "generated"
                          ? "bg-[#1B64F2]/10 text-[#1B64F2] border border-[#1B64F2]/30"
                          : "bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30"
                      }`}
                    >
                      {brief.status}
                    </span>
                    <span className="text-sm text-[#8A94B3] whitespace-nowrap">
                      {new Date(brief.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0B1F3B] mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/keywords" className="block">
                <Button className="w-full justify-start bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30">
                  <Target className="h-4 w-4 mr-2" />
                  Research Keywords
                </Button>
              </Link>
              <Link to="/competitor-analysis" className="block">
                <Button className="w-full justify-start bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30">
                  <Globe className="h-4 w-4 mr-2" />
                  Analyze Competitors
                </Button>
              </Link>
              <Link to="/briefs" className="block">
                <Button className="w-full justify-start bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Brief
                </Button>
              </Link>
              <Link to="/calendar" className="block">
                <Button className="w-full justify-start bg-white hover:bg-[#F6F8FC] text-[#5B6B8A] border border-[#8A94B3]/30">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Info Card */}
          {!projectStats && !loading && (
            <div className="rounded-xl bg-blue-50 p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">
                📊 No Stats Yet
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Add keywords and track rankings to see your project statistics.
              </p>
              <Button
                onClick={refreshStats}
                disabled={refreshing}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Generate Stats
              </Button>
            </div>
          )}

          {/* CTA Card */}
          <div className="rounded-xl bg-gradient-to-br from-[#0B1F8A] via-[#1246C9] to-[#1B64F2] p-6 border border-[#1B64F2]/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3EF0C1] rounded-full blur-2xl"></div>
            </div>
            <div className="relative z-10">
              <h3 className="font-semibold text-white mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-white/80 mb-4">
                Get unlimited briefs and advanced SERP analysis
              </p>
              <Button
                className="w-full bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
                size="sm"
                onClick={() => navigate("/plans")}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
