import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Globe, Plus, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";

export default function Competitors() {
  const { currentProject, user } = useApp();
  const [domain, setDomain] = useState("");
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!currentProject) return;

    const channel = supabase
      .channel("competitors")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competitors",
          filter: `project_id=eq.${currentProject.id}`,
        },
        () => queryClient.invalidateQueries(["competitors", currentProject.id])
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [currentProject, queryClient]);

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitors", currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return { data: [] };

      const response = await supabase
        .from("competitors")
        .select("*")
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false });

      return response;
    },
    enabled: !!currentProject,
  });
  const { data: activeJobs } = useQuery({
    queryKey: ["active-jobs", currentProject?.id],
    queryFn: async () => {
      const { data } = await supabase
  .from("job_logs")
  .select("id, payload, status")
  .eq("job_type", "analyze-competitor")
  .in("status", ["pending", "processing"])
  .eq("payload->>project_id", currentProject?.id)  // ✅ Now correct
  .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentProject,
    refetchInterval: 3000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!currentProject || !user) throw new Error("No project or user found");

      // ✅ NEW: Instead of calling the Edge Function directly, we insert into the queue
      const { data, error } = await supabase
  .from("job_logs")
  .insert({
    job_type: "analyze-competitor",
    status: "pending",
    payload: {
      domain,
      project_id: currentProject.id,
      user_id: user.id,  // Keep here for worker/RLS
    },
  })
  .select()
  .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate queries so the user sees the "Pending" state if you choose to show it
      queryClient.invalidateQueries(["competitors", currentProject?.id]);
      toast.success("Analysis started in the background!");
      setDomain("");
    },
    onError: (error: any) => {
      console.error("Error queueing competitor analysis:", error);
      toast.error(error.message || "Failed to start analysis");
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async ({ gaps }: { gaps: string[] }) => {
      if (!currentProject || !user) throw new Error("Missing project or user");

      const keywords = gaps.map((gap) => ({
        project_id: currentProject.id,
        user_id: user.id,
        keyword: gap,
        status: "queued",
      }));
      return supabase.from("keywords").insert(
        keywords.map((k) => ({
          ...k,
          status: "queued",
        })),
        { ignoreDuplicates: true }
      );
    },
    onSuccess: () => {
      toast.success("Gaps added to keywords!");
      queryClient.invalidateQueries(["competitors", currentProject?.id]);
    },
    onError: (error) => {
      console.error("Error adding gaps:", error);
      toast.error("Failed to add gaps");
    },
  });

  const handleAddCompetitor = () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    if (!currentProject) {
      toast.error("Please select a project first");
      return;
    }
    analyzeMutation.mutate(domain.trim());
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 dark">
        {/* Header - Styled like Keywords */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Competitor Analysis
            </h1>
            <p className="text-muted-foreground">
              Analyze competitor domains and find content gaps
            </p>
          </div>
        </div>

        {/* Add Competitor - Styled like Keywords */}
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter competitor domain (e.g., example.com)..."
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
              className="pl-10 input-contrast" // Key Fix: Match the Keywords input style
            />
          </div>
          <Button
            variant="gradient"
            onClick={handleAddCompetitor}
            disabled={analyzeMutation.isPending || !currentProject}
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {!currentProject && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Please create or select a project first to analyze competitors.
            </p>
          </div>
        )}

        {/* Competitors Table - Wrapped in a card like Keywords */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full table-contrast">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domain
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Traffic Estimate
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  Content Gaps
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">
                  Added On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* 1. Show Active Background Jobs First */}
              {activeJobs?.map((job: any) => (
                <tr key={job.id} className="bg-primary/5 animate-pulse">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="font-medium text-muted-foreground">
                        {job.payload.domain}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground italic">
                    Analyzing...
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {job.status === "processing"
                        ? "AI Processing"
                        : "In Queue"}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">—</td>
                  <td className="p-4 text-right">
                    <Button disabled variant="ghost" size="sm">
                      Waiting
                    </Button>
                  </td>
                </tr>
              ))}
              {!competitors?.data || competitors.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No competitors analyzed yet. Add a competitor domain to get
                    started.
                  </td>
                </tr>
              ) : (
                competitors.data.map((competitor: any) => (
                  <tr
                    key={competitor.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-medium text-foreground">
                        {competitor.domain}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">
                        {competitor.traffic_estimate
                          ? competitor.traffic_estimate.toLocaleString()
                          : "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {competitor.gaps?.length || 0} gaps found
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">
                        {new Date(competitor.created_at).toLocaleDateString()}
                      </span>
                    </td>
                   
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
