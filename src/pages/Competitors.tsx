import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Globe, Plus, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import ConnectGoogleAnalytics from "../components/ConnectGoogleAnalytics";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import SelectGAProperty from "../components/SelectGAProperty";

// Move YourSiteTraffic outside the main component
const YourSiteTraffic = ({ projectId }: { projectId: string }) => {
  const [stats, setStats] = useState({ sessions: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('ga-report', {
          body: { projectId, days: 30 }
        });

        if (error) throw error;

        setStats({
          sessions: data?.sessions || 0,
          users: data?.users || 0,
        });
      } catch (error) {
        console.error("Error fetching GA stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [projectId]);

  if (loading) return <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />;

  return (
    <div className="grid grid-cols-2 gap-6 text-center">
      <div>
        <div className="text-2xl font-bold text-[#1B64F2]">{stats.sessions.toLocaleString()}</div>
        <div className="text-sm text-[#5B6B8A]">Sessions (30d)</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#1B64F2]">{stats.users.toLocaleString()}</div>
        <div className="text-sm text-[#5B6B8A]">Users (30d)</div>
      </div>
    </div>
  );
};

export default function Competitors() {
  const { currentProject, user } = useApp();
  const [domain, setDomain] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentProject) return;
    console.log(currentProject);

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
        () => queryClient.invalidateQueries({ queryKey: ["competitors", currentProject.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      queryClient.invalidateQueries({ queryKey: ["competitors", currentProject?.id] });
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
      return supabase.from("keywords").insert(keywords, { ignoreDuplicates: true });
    },
    onSuccess: () => {
      toast.success("Gaps added to keywords!");
      queryClient.invalidateQueries({ queryKey: ["competitors", currentProject?.id] });
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
  
  const { data: trafficData } = useQuery({
    queryKey: ["traffic", currentProject?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("ga-report", {
          body: { projectId: currentProject?.id, days: 30 }
        });

        console.log("GA report projectId:", currentProject?.id);
        console.log("Traffic fetch response:", data);

        if (error) throw error;
        return data?.sessions || 0;
      } catch (error) {
        console.error("Traffic fetch error:", error);
        return 0;
      }
    },
    enabled: !!currentProject?.ga_connected && !!currentProject?.ga_property_id
  });

  const currentProjectTraffic = trafficData || 1;

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
    
      <div className="space-y-6 bg-[#F6F8FC] min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">
              Competitor Analysis
            </h1>
            <p className="text-black">
              Analyze competitor domains and find content gaps
            </p>
          </div>
        </div>

        <ConnectGoogleAnalytics projectId={currentProject?.id} />
        
      
          <SelectGAProperty projectId={currentProject.id} />
        
        
        {currentProject?.ga_connected && currentProject?.ga_property_id && (
          <>
            <AnalyticsDashboard projectId={currentProject.id} />
            
            <div className="bg-gradient-to-r from-[#1B64F2]/10 to-[#FFD84D]/10 border border-[#1B64F2]/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-black" />
                <h2 className="text-xl font-bold text-black">Your Site Traffic</h2>
              </div>
              <YourSiteTraffic projectId={currentProject.id} />
            </div>
          </>
        )}

        {/* Add Competitor */}
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
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
                    Traffic vs Yours
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">Gaps Found</th>
                <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">Added On</th>
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
                    colSpan={4}
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
                      {competitor.traffic_estimate ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            competitor.traffic_estimate > currentProjectTraffic 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {competitor.traffic_estimate.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#5B6B8A]">
                            ({((competitor.traffic_estimate/currentProjectTraffic)*100 - 100).toFixed(0)}%)
                          </span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {competitor.gaps?.length || 0}
                        <Plus className="h-3 w-3" />
                      </span>
                    </td>
                    <td className="p-4 text-[#5B6B8A]">
                      {new Date(competitor.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
   
  );
}