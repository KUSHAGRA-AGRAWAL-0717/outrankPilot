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
        .eq("payload->>project_id", currentProject?.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentProject,
    refetchInterval: 3000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!currentProject || !user) throw new Error("No project or user found");

      const { data, error } = await supabase
        .from("job_logs")
        .insert({
          job_type: "analyze-competitor",
          status: "pending",
          payload: {
            domain,
            project_id: currentProject.id,
            user_id: user.id,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
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
          <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-[#F6F8FC] min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1F3B]">
              Competitor Analysis
            </h1>
            <p className="text-[#5B6B8A]">
              Analyze competitor domains and find content gaps
            </p>
          </div>
        </div>

        {/* Add Competitor */}
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94B3]" />
            <Input
              placeholder="Enter competitor domain (e.g., example.com)..."
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
              className="pl-10 h-12 bg-white border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
            />
          </div>
          <Button
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold h-12"
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
          <div className="rounded-lg border border-[#FFD84D]/50 bg-[#FFD84D]/10 p-4">
            <p className="text-sm text-[#0B1F3B]">
              Please create or select a project first to analyze competitors.
            </p>
          </div>
        )}

        {/* Competitors Table */}
        <div className="rounded-xl border border-[#8A94B3]/30 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8A94B3]/30 bg-[#F6F8FC]">
                <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domain
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Traffic Estimate
                  </div>
                </th>
               
                <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                  Added On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8A94B3]/30">
              {/* Active Background Jobs */}
              {activeJobs?.map((job: any) => (
                <tr key={job.id} className="bg-[#1B64F2]/5 animate-pulse">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#1B64F2]" />
                      <span className="font-medium text-[#0B1F3B]">
                        {job.payload.domain}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[#5B6B8A] italic">
                    Analyzing...
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-medium text-[#5B6B8A] border border-[#8A94B3]/30">
                      {job.status === "processing"
                        ? "AI Processing"
                        : "In Queue"}
                    </span>
                  </td>
                  <td className="p-4 text-[#8A94B3]">—</td>
                </tr>
              ))}
              
              {!competitors?.data || competitors.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-[#5B6B8A]"
                  >
                    No competitors analyzed yet. Add a competitor domain to get
                    started.
                  </td>
                </tr>
              ) : (
                competitors.data.map((competitor: any) => (
                  <tr
                    key={competitor.id}
                    className="hover:bg-[#F6F8FC]/50 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-medium text-[#0B1F3B]">
                        {competitor.domain}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#0B1F3B]">
                        {competitor.traffic_estimate
                          ? competitor.traffic_estimate.toLocaleString()
                          : "—"}
                      </span>
                    </td>
                   
                    <td className="p-4">
                      <span className="text-[#5B6B8A]">
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