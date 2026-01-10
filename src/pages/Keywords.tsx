import { useState, useEffect } from "react";
import { Plus, Loader2, CheckCircle2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";

interface KeywordData {
  id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  status: "queued" | "analyzing" | "ready" | "generated" | "failed";
}

export default function Keywords() {
  const { currentProject, user } = useApp();
  const navigate = useNavigate();

  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadKeywords = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("keywords")
        .select("id, keyword, volume, difficulty, status")
        .eq("project_id", currentProject.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setKeywords(data ?? []);
    } catch (error) {
      console.error("Error loading keywords:", error);
      toast.error("Failed to load keywords");
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentProject) {
      setLoading(false);
      return;
    }
    
    loadKeywords();

    const channel = supabase
      .channel("keyword-status-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "keywords",
          filter: `project_id=eq.${currentProject.id}`,
        },
        (payload) => {
          setKeywords((prev) =>
            prev.map((k) => (k.id === payload.new.id ? { ...k, ...payload.new } : k))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject?.id]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    if (!currentProject) {
      toast.error("Please create a project first", {
        action: {
          label: "Create Project",
          onClick: () => navigate("/projects/new"),
        },
      });
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("keywords")
        .insert({
          keyword: newKeyword.trim(),
          project_id: currentProject.id,
          user_id: user.id,
          status: "queued",
        })
        .select()
        .single();

      if (error) throw error;

      const { error: jobError } = await supabase.from("job_logs").insert({
        job_type: "analyze-keywords",
        status: "pending",
        payload: {
          keyword_id: data.id,
          keyword: data.keyword,
          project_id: currentProject.id,
          user_id: user.id,
        },
      });

      if (jobError) throw jobError;

      setNewKeyword("");
      setKeywords((prev) => [data, ...prev]);
      toast.success("Keyword added & analysis queued");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add keyword");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBrief = async (k: KeywordData) => {
    if (!currentProject || !user) {
      toast.error("Missing project or user");
      return;
    }

    try {
      const { error: jobError } = await supabase.from("job_logs").insert({
        job_type: "generate-brief",
        status: "pending",
        payload: {
          keyword_id: k.id,
          keyword: k.keyword,
          project_id: currentProject.id,
          user_id: user.id,
        },
      });

      if (jobError) throw jobError;

      toast.success("Brief generation started");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to start brief generation");
    }
  };

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
              Add keywords to analyze and generate content briefs
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
                      <th className="text-left p-4 font-medium text-[#5B6B8A]">Status</th>
                      <th className="text-right p-4 font-medium text-[#5B6B8A]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((k) => (
                      <tr key={k.id} className="border-b border-[#8A94B3]/30 hover:bg-[#F6F8FC]/50">
                        <td className="p-4 font-medium text-[#0B1F3B]">{k.keyword}</td>
                        <td className="p-4 text-[#5B6B8A]">{k.volume ?? "—"}</td>
                        <td className="p-4 text-[#5B6B8A]">{k.difficulty ?? "—"}</td>
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
                            disabled={k.status === "generated" || k.status === "analyzing"}
                            className={k.status === "generated" 
                              ? "bg-[#F6F8FC] text-[#3EF0C1] border border-[#3EF0C1]/30"
                              : "bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold"
                            }
                            onClick={() => handleGenerateBrief(k)}
                          >
                            {k.status === "generated" ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                Generated ✓
                              </span>
                            ) : k.status === "analyzing" ? (
                              "Generating..."
                            ) : (
                              "Generate Brief"
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