import { useState, useEffect } from "react";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
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
  status: "queued" | "analyzing" | "ready" | "generated" | "failed";  // ✅ Add generated
}

export default function Keywords() {
  const { currentProject, user } = useApp();
  const navigate = useNavigate();

  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🔄 Load keywords
  const loadKeywords = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from("keywords")
      .select("id, keyword, volume, difficulty, status")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load keywords");
      return;
    }

    setKeywords(data ?? []);
    setLoading(false);
  };

  // 📡 Realtime Subscription: Update UI when worker finishes
  useEffect(() => {
    if (!currentProject) return;
    
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

  // ➕ Add keyword + Queue Job
  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !currentProject || !user) return;

    setSubmitting(true);

    try {
      // 1️⃣ Insert keyword into DB (for UI display)
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

      // 2️⃣ Insert Job Log (for Worker to pick up)
      // 2️⃣ Insert Job Log (match edge function exactly)
const { error: jobError } = await supabase.from("job_logs").insert({
  job_type: "analyze-keywords",
  status: "pending",
  payload: {
    keyword_id: data.id,      // ✅ snake_case to match edge fn
    keyword: data.keyword,
    project_id: currentProject.id,  // ✅ snake_case
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

  // 📝 Generate Brief + Queue Job
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
        keyword_id: k.id,      // ✅ snake_case to match worker/edge
        keyword: k.keyword,
        project_id: currentProject.id,
        user_id: user.id,      // ✅ CRITICAL: was missing!
      },
    });

    if (jobError) throw jobError;

    toast.success("Brief generation started");
  } catch (e: any) {
    console.error(e);
    toast.error("Failed to start brief generation");
  }
};




  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Keyword Research</h1>

        <div className="flex gap-4 max-w-xl">
          <Input
            placeholder="Enter keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
          <Button onClick={handleAddKeyword} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>

        <table className="w-full border">
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Volume</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keywords.map((k) => (
              <tr key={k.id}>
                <td>{k.keyword}</td>
                <td>{k.volume ?? "—"}</td>
                <td>{k.difficulty ?? "—"}</td>
<td className="capitalize">
  {k.status === "queued" && "Queued"}
  {k.status === "analyzing" && "Analyzing…"} 
  {k.status === "ready" && (
    <span className="text-green-500 flex items-center gap-1">
      <CheckCircle2 className="h-4 w-4" /> Ready
    </span>
  )}
  {k.status === "generated" && (  // ✅ New status
    <span className="text-blue-500 flex items-center gap-1">
      <CheckCircle2 className="h-4 w-4" /> Brief Generated
    </span>
  )}
  {k.status === "failed" && <span className="text-red-500">Failed</span>}
</td>

<td>
  <Button
    size="sm"
    disabled={k.status === "generated" || k.status === "analyzing"}  // ✅ Disable after generated
    variant={k.status === "generated" ? "secondary" : "default"}
    onClick={() => handleGenerateBrief(k)}
  >
    {k.status === "generated" ? (
      <span className="flex items-center gap-1 text-green-600">
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
    </DashboardLayout>
  );
}
