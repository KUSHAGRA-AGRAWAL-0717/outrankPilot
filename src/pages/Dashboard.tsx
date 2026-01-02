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
      // Fetch project_stats (precomputed cache)
      const { data: statsData, error: statsError } = await supabase
        .from("project_stats")
        .select("*")
        .eq("project_id", currentProject.id)
        .maybeSingle();

      // Fetch last 3 briefs (still live)
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
  },
  {
    label: "Avg. Position",
    value: loading
      ? "..."
      : projectStats?.avg_rank != null
      ? Number(projectStats.avg_rank).toFixed(2)
      : "...",
    icon: Zap,
  },
  {
    label: "Traffic Potential",
    value: loading ? "..." : projectStats?.traffic_potential ?? "...",
    icon: TrendingUp,
  },
  {
    label: "Health Score",
    value: loading
      ? "..."
      : projectStats?.health_score != null
      ? `${Math.round(projectStats.health_score)}%`
      : "...",
    icon: TrendingUp,
  },
];


  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with {currentProject?.name}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Link to="/keywords">
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                New Brief
              </Button>
            </Link>
            <Button
              variant="outline"
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
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-sm text-primary font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Briefs & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Briefs */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Briefs
              </h2>
              <Link to="/briefs">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-4 text-muted-foreground">Loading...</div>
              ) : recentBriefs.length === 0 ? (
                <div className="p-4 text-muted-foreground">
                  No briefs found.
                </div>
              ) : (
                recentBriefs.map((brief) => (
                  <div
                    key={brief.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {brief.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {brief.keyword}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          brief.status === "published"
                            ? "bg-primary/10 text-primary"
                            : brief.status === "generated"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {brief.status}
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
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
            <div className="rounded-xl border border-border bg-card shadow-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link to="/keywords" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Research Keywords
                  </Button>
                </Link>
                <Link to="/competitor-analysis" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Analyze Competitors
                  </Button>
                </Link>
                <Link to="/briefs" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Brief
                  </Button>
                </Link>
                <Link to="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-xl bg-gradient-hero p-6 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get unlimited briefs and advanced SERP analysis
              </p>
              <Button
                variant="gradient"
                size="sm"
                className="w-full"
                onClick={() => navigate("/plans")}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
