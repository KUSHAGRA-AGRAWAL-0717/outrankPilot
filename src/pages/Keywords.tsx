import { useState, useEffect } from "react";
import { Plus, Loader2, CheckCircle2, FolderPlus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";

interface KeywordData {
  id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  priority_score: number | null;
  status: "queued" | "analyzing" | "ready" | "generated" | "failed";
}

interface KeywordsProps {
  projectId?: string | null;
  onSubmit?: () => void;
  onboardingMode?: boolean;
}

export default function Keywords({ 
  projectId: propProjectId, 
  onSubmit, 
  onboardingMode = false 
}: KeywordsProps) {
  const { currentProject, user } = useApp();
  const navigate = useNavigate();

  const effectiveProjectId = onboardingMode ? propProjectId : currentProject?.id;

  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAddedKeyword, setHasAddedKeyword] = useState(false);
  const [generatingBriefs, setGeneratingBriefs] = useState<Set<string>>(new Set());

  const loadKeywords = async () => {
    if (!effectiveProjectId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("keywords")
        .select("id, keyword, volume, difficulty, cpc, intent, priority_score, status")
        .eq("project_id", effectiveProjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setKeywords(data ?? []);
      
      if (onboardingMode && data && data.length > 0) {
        setHasAddedKeyword(true);
      }
    } catch (error) {
      console.error("Error loading keywords:", error);
      toast.error("Failed to load keywords");
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveProjectId) {
      setLoading(false);
      return;
    }
    
    loadKeywords();

    // Realtime subscription with error handling and status monitoring
    const channel = supabase
      .channel(`keyword-updates-${effectiveProjectId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "keywords",
          filter: `project_id=eq.${effectiveProjectId}`,
        },
        (payload) => {
          
          setKeywords((prev) =>
            prev.map((k) => (k.id === payload.new.id ? { ...k, ...payload.new } : k))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "keywords",
          filter: `project_id=eq.${effectiveProjectId}`,
        },
        (payload) => {
         
          // Only add if not already in list (optimistic update already added it)
          setKeywords((prev) => {
            const exists = prev.some((k) => k.id === payload.new.id);
            if (exists) {
              return prev.map((k) => (k.id === payload.new.id ? { ...k, ...payload.new } : k));
            }
            return [payload.new as KeywordData, ...prev];
          });
        }
      )
      .subscribe((status, err) => {
        
        if (err) {
          console.error("Realtime subscription error:", err);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error("Channel error - retrying subscription");
          // Optionally reload data
          loadKeywords();
        }
      });

    return () => {
      
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    if (!effectiveProjectId) {
      if (!onboardingMode) {
        toast.error("Please create a project first", {
          action: {
            label: "Create Project",
            onClick: () => navigate("/projects/new"),
          },
        });
      } else {
        toast.error("Project ID is missing");
      }
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setSubmitting(true);

    try {
      const { data: keywordData, error: insertError } = await supabase
        .from("keywords")
        .insert({
          keyword: newKeyword.trim(),
          project_id: effectiveProjectId,
          user_id: user.id,
          status: "queued",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setNewKeyword("");
      setHasAddedKeyword(true);
      
      // Optimistically update state to "analyzing"
      const analyzingKeyword = { ...keywordData, status: "analyzing" as const };
      setKeywords((prev) => [analyzingKeyword, ...prev]);
      
      toast.success("Analyzing keyword...");

      if (onboardingMode && onSubmit && !hasAddedKeyword) {
        onSubmit();
      }

      // Invoke edge function
      const { error: functionError } = await supabase.functions.invoke(
        "analyze-keywords",
        {
          body: {
            keyword_id: keywordData.id,
            keyword: keywordData.keyword,
            project_id: effectiveProjectId,
          },
        }
      );

      if (functionError) {
        console.error("Analysis function error:", functionError);
        setKeywords((prev) =>
          prev.map((k) => (k.id === keywordData.id ? { ...k, status: "failed" } : k))
        );
        toast.error("Keyword analysis failed. Check your API keys.");
      } else {
        // Poll for status update as backup if realtime fails
        setTimeout(() => {
          supabase
            .from("keywords")
            .select("status, volume, difficulty, cpc, intent, priority_score")
            .eq("id", keywordData.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setKeywords((prev) =>
                  prev.map((k) =>
                    k.id === keywordData.id
                      ? {
                          ...k,
                          ...data,
                          status: (["queued", "analyzing", "ready", "generated", "failed"].includes(data.status)
                            ? data.status
                            : "queued") as KeywordData["status"],
                        }
                      : k
                  )
                );
              }
            });
        }, 3000); // Poll after 3 seconds
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add keyword");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBrief = async (k: KeywordData) => {
    if (!effectiveProjectId || !user) {
      toast.error("Missing project or user");
      return;
    }

    if (k.status !== "ready" || generatingBriefs.has(k.id)) {
      return;
    }

    setGeneratingBriefs((prev) => new Set(prev).add(k.id));

    try {
      // Optimistically update local state
      setKeywords((prev) =>
        prev.map((keyword) =>
          keyword.id === k.id ? { ...keyword, status: "analyzing" } : keyword
        )
      );

      toast.success("Generating brief...");

      const { error: functionError } = await supabase.functions.invoke(
        "generate-brief",
        {
          body: {
            keyword_id: k.id,
            keyword: k.keyword,
            project_id: effectiveProjectId,
            user_id: user.id,
          },
        }
      );

      if (functionError) {
        console.error("Brief generation error:", functionError);
        setKeywords((prev) =>
          prev.map((keyword) =>
            keyword.id === k.id ? { ...keyword, status: "ready" } : keyword
          )
        );
        toast.error("Failed to generate brief");
      } else {
        // Poll for status update as backup
        setTimeout(() => {
          supabase
            .from("keywords")
            .select("status")
            .eq("id", k.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setKeywords((prev) =>
                  prev.map((keyword) =>
                    keyword.id === k.id
                      ? {
                          ...keyword,
                          ...data,
                          status: (["queued", "analyzing", "ready", "generated", "failed"].includes(data.status)
                            ? data.status
                            : "queued") as KeywordData["status"],
                        }
                      : keyword
                  )
                );
              }
            });
        }, 3000);
      }
    } catch (e: any) {
      console.error(e);
      setKeywords((prev) =>
        prev.map((keyword) =>
          keyword.id === k.id ? { ...keyword, status: "ready" } : keyword
        )
      );
      toast.error("Failed to start brief generation");
    } finally {
      setGeneratingBriefs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(k.id);
        return newSet;
      });
    }
  };

  // Onboarding Mode: Simplified UI
  if (onboardingMode) {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Add Keyword Input */}
        <div className="flex gap-4">
          <Input
            placeholder="Enter keyword (e.g., 'best running shoes')"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
            disabled={submitting}
            className="h-12 bg-white border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
          />
          <Button 
            onClick={handleAddKeyword} 
            disabled={submitting}
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold h-12 px-6"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Keywords List - Compact view for onboarding */}
        {keywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#5B6B8A]">
              Added Keywords ({keywords.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {keywords.map((k) => (
                <div 
                  key={k.id} 
                  className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg border border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-[#0B1F3B]">{k.keyword}</span>
                    {k.status === "analyzing" && (
                      <span className="text-xs text-[#1B64F2] flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing...
                      </span>
                    )}
                    {k.status === "ready" && (
                      <span className="text-xs text-[#10B981] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ready
                      </span>
                    )}
                    {k.status === "failed" && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        Failed
                      </span>
                    )}
                  </div>
                  {k.volume && (
                    <span className="text-xs text-[#5B6B8A]">
                      Vol: {k.volume.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {keywords.length === 0 && (
          <div className="text-center py-8 text-[#8A94B3]">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Add at least one keyword to continue</p>
          </div>
        )}
      </div>
    );
  }

  // Regular Mode: Full Dashboard UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B64F2]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F6F8FC] min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3B]">Keyword Research</h1>
          <p className="text-[#5B6B8A]">
            Analyze keywords with SERP data, search intent, and priority scoring
          </p>
        </div>
        {!currentProject && (
          <Button 
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
            onClick={() => navigate("/projects/new")}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </div>

      {/* No Project Warning */}
      {!currentProject ? (
        <div className="rounded-xl border border-[#8A94B3]/30 bg-white p-12 text-center">
          <FolderPlus className="h-12 w-12 mx-auto text-[#8A94B3] mb-4" />
          <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">No Project Selected</h3>
          <p className="text-[#5B6B8A] mb-4">
            Create a project first to start adding keywords
          </p>
          <Button 
            className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
            onClick={() => navigate("/projects/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <>
          {/* Add Keyword Input */}
          <div className="flex gap-4 max-w-xl">
            <Input
              placeholder="Enter keyword (e.g., 'best running shoes')"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
              disabled={submitting}
              className="h-12 bg-white border-[#8A94B3]/30 focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
            />
            <Button 
              onClick={handleAddKeyword} 
              disabled={submitting}
              className="bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold h-12"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>

          {/* Keywords Table */}
          {keywords.length === 0 ? (
            <div className="rounded-xl border border-[#8A94B3]/30 bg-white p-12 text-center">
              <Plus className="h-12 w-12 mx-auto text-[#8A94B3] mb-4" />
              <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">No Keywords Yet</h3>
              <p className="text-[#5B6B8A]">
                Add your first keyword above to start analyzing
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#8A94B3]/30 bg-white overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-[#F6F8FC] border-b border-[#8A94B3]/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Keyword</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Volume</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Difficulty</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">CPC</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Intent</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Priority</th>
                    <th className="text-left p-4 font-medium text-[#5B6B8A]">Status</th>
                    <th className="text-right p-4 font-medium text-[#5B6B8A]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k) => (
                    <tr key={k.id} className="border-b border-[#8A94B3]/30 hover:bg-[#F6F8FC]/50">
                      <td className="p-4 font-medium text-[#0B1F3B]">{k.keyword}</td>
                      <td className="p-4 text-[#5B6B8A]">{k.volume?.toLocaleString() ?? "—"}</td>
                      <td className="p-4 text-[#5B6B8A]">{k.difficulty ?? "—"}</td>
                      <td className="p-4 text-[#5B6B8A]">${k.cpc ?? "—"}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded capitalize ${
                          k.intent === 'transactional' ? 'bg-green-100 text-green-700' :
                          k.intent === 'commercial' ? 'bg-blue-100 text-blue-700' :
                          k.intent === 'navigational' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {k.intent ?? "—"}
                        </span>
                      </td>
                      <td className="p-4 text-[#5B6B8A]">
                        {k.priority_score ? `${k.priority_score}/100` : "—"}
                      </td>
                      <td className="p-4 capitalize">
                        {k.status === "queued" && (
                          <span className="text-[#8A94B3]">Queued</span>
                        )}
                        {k.status === "analyzing" && (
                          <span className="text-[#1B64F2] flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                          </span>
                        )}
                        {k.status === "ready" && (
                          <span className="text-[#3EF0C1] flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Ready
                          </span>
                        )}
                        {k.status === "generated" && (
                          <span className="text-[#1B64F2] flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Brief Generated
                          </span>
                        )}
                        {k.status === "failed" && (
                          <span className="text-red-500">Failed</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          disabled={k.status !== "ready" || generatingBriefs.has(k.id)}
                          className={k.status === "generated" 
                            ? "bg-[#F6F8FC] text-[#3EF0C1] border border-[#3EF0C1]/30 cursor-not-allowed"
                            : "bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          }
                          onClick={() => handleGenerateBrief(k)}
                        >
                          {k.status === "generated" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Generated ✓
                            </span>
                          ) : generatingBriefs.has(k.id) || k.status === "analyzing" ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </span>
                          ) : k.status === "ready" ? (
                            "Generate Brief"
                          ) : (
                            "Waiting..."
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
