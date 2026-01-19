import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Globe, 
  Plus, 
  TrendingUp, 
  Loader2, 
  Link as LinkIcon,
  Target,
  ArrowUpRight,
  Download,
  Trash2,
  Eye,
  BarChart2,
  Search
} from "lucide-react";

interface CompetitorsProps {
  projectId?: string;
  onSubmit?: () => void;
  onboardingMode?: boolean;
}

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

const KeywordPreviewCard = ({ keywords }: { keywords: string[] }) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="absolute left-0 top-full mt-2 w-96 bg-white border border-[#8A94B3]/30 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#8A94B3]/20">
        <Search className="h-4 w-4 text-[#1B64F2]" />
        <h4 className="font-semibold text-[#0B1F3B] text-sm">Keyword Gaps Preview</h4>
        <span className="ml-auto text-xs bg-[#1B64F2]/10 text-[#1B64F2] px-2 py-0.5 rounded-full font-medium">
          {keywords.length} keywords
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1.5">
        {keywords.slice(0, 20).map((keyword, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F6F8FC] transition-colors group"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#1B64F2] flex-shrink-0"></div>
            <span className="text-sm text-[#0B1F3B] group-hover:text-[#1B64F2] transition-colors">
              {keyword}
            </span>
          </div>
        ))}
        {keywords.length > 20 && (
          <div className="text-xs text-[#5B6B8A] text-center pt-2 border-t border-[#8A94B3]/20">
            +{keywords.length - 20} more keywords
          </div>
        )}
      </div>
    </div>
  );
};

export default function Competitors({ 
  projectId: propProjectId,
  onSubmit,
  onboardingMode = false 
}: CompetitorsProps = {}) {
  const { currentProject, user } = useApp();
  const [domain, setDomain] = useState("");
  const [analyzingDomains, setAnalyzingDomains] = useState<Set<string>>(new Set());
  const [hoveredCompetitorId, setHoveredCompetitorId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Use prop projectId if provided, otherwise use currentProject
  const activeProjectId = propProjectId || currentProject?.id;

  const toggleCardExpansion = (competitorId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(competitorId)) {
        newSet.delete(competitorId);
      } else {
        newSet.add(competitorId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!activeProjectId) return;

    const channel = supabase
      .channel("competitors")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competitors",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["competitors", activeProjectId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProjectId, queryClient]);

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitors", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];

      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // ✅ CRITICAL: Trigger onSubmit if competitors exist (for onboarding)
      if (data && data.length > 0 && onSubmit && onboardingMode) {
        onSubmit();
      }
      
      return data || [];
    },
    enabled: !!activeProjectId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!activeProjectId || !user) throw new Error("No project or user found");

      setAnalyzingDomains(prev => new Set(prev).add(domain));

      try {
        const { data, error } = await supabase.functions.invoke("analyze-competitor", {
          body: {
            domain,
            project_id: activeProjectId,
            user_id: user.id,
          },
        });

        if (error) throw error;
        return data;
      } finally {
        setAnalyzingDomains(prev => {
          const newSet = new Set(prev);
          newSet.delete(domain);
          return newSet;
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["competitors", activeProjectId] });
      toast.success(`Analysis complete! Found ${data?.gaps?.length || 0} keyword gaps`);
      setDomain("");
      
      // ✅ CRITICAL: Call onSubmit after successful competitor addition
      if (onSubmit && onboardingMode) {
        onSubmit();
      }
    },
    onError: (error: any) => {
      console.error("Error analyzing competitor:", error);
      toast.error(error.message || "Failed to analyze competitor");
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async ({ gaps, competitorId }: { gaps: string[]; competitorId: string }) => {
      if (!activeProjectId || !user) throw new Error("Missing project or user");

      const keywords = gaps.map((gap) => ({
        project_id: activeProjectId,
        user_id: user.id,
        keyword: gap,
        status: "queued",
      }));

      const { error } = await supabase.from("keywords").insert(keywords);
      if (error) throw error;

      await supabase
        .from("competitors")
        .update({ gaps_added: true })
        .eq("id", competitorId);

      return gaps.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} keyword gaps added to your project!`);
      queryClient.invalidateQueries({ queryKey: ["competitors", activeProjectId] });
    },
    onError: (error) => {
      console.error("Error adding gaps:", error);
      toast.error("Failed to add keyword gaps");
    },
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const { error } = await supabase
        .from("competitors")
        .delete()
        .eq("id", competitorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Competitor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["competitors", activeProjectId] });
    },
    onError: (error) => {
      console.error("Error deleting competitor:", error);
      toast.error("Failed to delete competitor");
    },
  });

  const handleAddCompetitor = () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }
    if (!activeProjectId) {
      toast.error("Please select a project first");
      return;
    }

    const cleanDomain = domain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    analyzeMutation.mutate(cleanDomain);
  };

  const { data: trafficData } = useQuery({
    queryKey: ["traffic", activeProjectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("ga-report", {
          body: { projectId: activeProjectId, days: 30 }
        });

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  // ✅ Simplified view for onboarding mode
  if (onboardingMode) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B8A]" />
            <Input
              placeholder="competitor.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
              disabled={analyzeMutation.isPending}
              className="pl-10 h-12 bg-white border-2 border-[#E5E7EB] focus:border-[#1B64F2] focus:ring-2 focus:ring-[#1B64F2]/20 text-[#0B1F3B] placeholder:text-[#8A94B3]"
            />
          </div>
          <Button
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold h-12 px-6"
            onClick={handleAddCompetitor}
            disabled={analyzeMutation.isPending || !activeProjectId}
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Show added competitors */}
        {competitors && competitors.length > 0 && (
          <div className="space-y-2">
            {competitors.map((competitor: any) => (
              <div
                key={competitor.id}
                className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border-2 border-[#E5E7EB]"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#1B64F2]" />
                  <span className="text-[#0B1F3B] font-medium">{competitor.domain}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {competitor.gaps?.length || 0} gaps
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm(`Remove ${competitor.domain}?`)) {
                      deleteCompetitorMutation.mutate(competitor.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {(!competitors || competitors.length === 0) && (
          <p className="text-sm text-[#8A94B3] text-center py-4 bg-[#F6F8FC] rounded-lg border-2 border-dashed border-[#E5E7EB]">
            Add at least one competitor to continue
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F6F8FC] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3B] mb-1">
            Competitor Intelligence
          </h1>
          <p className="text-[#5B6B8A]">
            Discover competitor keywords, traffic estimates, and backlink opportunities
          </p>
        </div>
      </div>

      {/* Add Competitor */}
      <div className="flex gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B8A]" />
          <Input
            placeholder="Enter competitor domain (e.g., example.com)..."
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
            disabled={analyzeMutation.isPending}
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
                  Est. Traffic
                </div>
              </th>
              <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Shared Keywords
                </div>
              </th>
              <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Top Pages
                </div>
              </th>
              <th className="text-left text-sm font-medium text-[#5B6B8A] p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Keyword Gaps
                </div>
              </th>
              <th className="text-right text-sm font-medium text-[#5B6B8A] p-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#8A94B3]/30">
            {/* Active Analysis (in progress) */}
            {Array.from(analyzingDomains).map((analyzingDomain) => (
              <tr key={analyzingDomain} className="bg-[#1B64F2]/5">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1B64F2]" />
                    <span className="font-medium text-[#0B1F3B]">
                      {analyzingDomain}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-[#5B6B8A] italic" colSpan={5}>
                  Analyzing competitor data...
                </td>
              </tr>
            ))}
            
            {!competitors || competitors.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[#5B6B8A]">
                  <Globe className="h-12 w-12 mx-auto text-[#8A94B3] mb-4" />
                  <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">No Competitors Yet</h3>
                  <p className="text-sm">
                    Add a competitor domain above to discover keyword gaps and traffic insights
                  </p>
                </td>
              </tr>
            ) : (
              competitors.map((competitor: any) => (
                <tr
                  key={competitor.id}
                  className="hover:bg-[#F6F8FC]/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#5B6B8A]" />
                      <span className="font-medium text-[#0B1F3B]">
                        {competitor.domain}
                      </span>
                    </div>
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
                          ({competitor.traffic_estimate > currentProjectTraffic ? '+' : ''}
                          {((competitor.traffic_estimate / currentProjectTraffic * 100) - 100).toFixed(0)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#8A94B3]">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {competitor.shared_keywords?.length || 0}
                      <Target className="h-3 w-3" />
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {competitor.top_organics?.length || 0}
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </td>
                  <td className="p-4 relative">
                    <div
                      className="inline-block"
                      onMouseEnter={() => setHoveredCompetitorId(competitor.id)}
                      onMouseLeave={() => setHoveredCompetitorId(null)}
                    >
                      <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold cursor-pointer hover:bg-green-200 transition-colors">
                        {competitor.gaps?.length || 0}
                        <Eye className="h-3 w-3" />
                      </span>
                      {hoveredCompetitorId === competitor.id && competitor.gaps && competitor.gaps.length > 0 && (
                        <KeywordPreviewCard keywords={competitor.gaps} />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* <Button
                        size="sm"
                        className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold disabled:bg-gray-200 disabled:text-gray-500"
                        onClick={() => bulkAddMutation.mutate({ 
                          gaps: competitor.gaps || [], 
                          competitorId: competitor.id 
                        })}
                        disabled={
                          !competitor.gaps || 
                          competitor.gaps.length === 0 || 
                          competitor.gaps_added ||
                          bulkAddMutation.isPending
                        }
                      >
                        {competitor.gaps_added ? (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Added ✓
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Add {competitor.gaps?.length || 0}
                          </>
                        )}
                      </Button> */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${competitor.domain}?`)) {
                            deleteCompetitorMutation.mutate(competitor.id);
                          }
                        }}
                        disabled={deleteCompetitorMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Competitor Details Cards */}
      {competitors && competitors.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitors.slice(0, 3).map((competitor: any) => (
            <div 
              key={competitor.id}
              className="rounded-xl border border-[#8A94B3]/30 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0B1F3B] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#1B64F2]" />
                  {competitor.domain}
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5B6B8A]">Estimated Traffic:</span>
                  <span className="font-semibold text-[#0B1F3B]">
                    {competitor.traffic_estimate?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6B8A]">Shared Keywords:</span>
                  <span className="font-semibold text-[#0B1F3B]">
                    {competitor.shared_keywords?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6B8A]">Keyword Gaps:</span>
                  <span className="font-semibold text-green-600">
                    {competitor.gaps?.length || 0}
                  </span>
                </div>
              </div>

             {competitor.gaps && competitor.gaps.length > 0 && (
  <div className="mt-4 pt-4 border-t border-[#8A94B3]/30">
    <p className="text-xs text-[#5B6B8A] mb-2">Top Gap Keywords:</p>
    <div className="flex flex-wrap gap-1">
      {(expandedCards.has(competitor.id) 
        ? competitor.gaps 
        : competitor.gaps.slice(0, 3)
      ).map((gap: string, idx: number) => (
        <span 
          key={idx}
          className="text-xs bg-[#F6F8FC] text-[#0B1F3B] px-2 py-1 rounded hover:bg-[#E8ECFC] transition-colors"
        >
          {gap}
        </span>
      ))}
      {competitor.gaps.length > 3 && (
        <button
          onClick={() => toggleCardExpansion(competitor.id)}
          className="text-xs text-[#1B64F2] hover:text-[#0B1F3B] font-semibold px-2 py-1 rounded hover:bg-[#1B64F2]/10 transition-colors flex items-center gap-1"
        >
          {expandedCards.has(competitor.id) ? (
            <>
              Show less
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              +{competitor.gaps.length - 3} more
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  </div>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
