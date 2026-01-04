import {
  TrendingUp,
  FileText,
  Target,
  ArrowUpRight,
  Plus,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportProjectButtons from "../components/ExportProjectButtons";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useApp } from "@/contexts/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Brief {
  id: string;
  title: string;
  keyword: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { currentProject } = useApp();
  const navigate = useNavigate();
  const [projectStats, setProjectStats] = useState<any>(null);
  const [recentBriefs, setRecentBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentProject) return;
      setLoading(true);
      
      const { data: statsData, error: statsError } = await supabase
        .from("project_stats")
        .select("*")
        .eq("project_id", currentProject.id)
        .maybeSingle();

      const { data: briefsData, error: briefsDataError } = await supabase
        .from("content_briefs")
        .select("id, title, status, created_at, keywords:keyword_id(keyword)")
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!statsError) setProjectStats(statsData);
      if (!briefsDataError && briefsData) {
        setRecentBriefs(
          briefsData.map((b: any) => ({
            id: b.id,
            title: b.title,
            keyword: b.keywords?.keyword || "Unknown",
            status: b.status || "draft",
            createdAt: b.created_at,
          }))
        );
      }
      setLoading(false);
    };
    fetchStats();
  }, [currentProject]);

  const stats = [
    {
      label: "Keywords Tracked",
      value: loading ? "..." : projectStats?.keyword_count ?? "...",
      icon: Target,
      change: "+12%",
    },
    {
      label: "Avg. Position",
      value: loading
        ? "..."
        : projectStats?.avg_rank != null
        ? Number(projectStats.avg_rank).toFixed(2)
        : "...",
      icon: Zap,
      change: "+8%",
    },
    {
      label: "Traffic Potential",
      value: loading ? "..." : projectStats?.traffic_potential ?? "...",
      icon: TrendingUp,
      change: "+23%",
    },
    {
      label: "Health Score",
      value: loading
        ? "..."
        : projectStats?.health_score != null
        ? `${(projectStats.health_score / 100).toFixed(2)}%`
        : "...",
      icon: TrendingUp,
      change: "+5%",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-[#F6F8FC] min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F3B]">Welcome back</h1>
            <p className="text-[#5B6B8A] mt-1">
              Here's what's happening with {currentProject?.name}
            </p>
          </div>
          <div className="flex gap-2 items-center">
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
              Competitor Analysis
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B64F2]/10">
                  <stat.icon className="h-5 w-5 text-[#1B64F2]" />
                </div>
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
                <div className="p-4 text-[#5B6B8A]">Loading...</div>
              ) : recentBriefs.length === 0 ? (
                <div className="p-4 text-[#5B6B8A]">
                  No briefs found.
                </div>
              ) : (
                recentBriefs.map((brief) => (
                  <div
                    key={brief.id}
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
                  </div>
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
                    <Target className="h-4 w-4 mr-2" />
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
    </DashboardLayout>
  );
}