import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // This endpoint is mainly called by the worker so ensure authorization
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().slice(0, 10);

    const { data: projects } = await supabase.from("projects").select("id");

    for (const p of projects ?? []) {
      const { data: rankings } = await supabase.from("rankings").select("position").eq("project_id", p.id).eq("date", today);
      if (!rankings || rankings.length === 0) continue;
      const avgRank = rankings.reduce((s: number, r: any) => s + r.position, 0) / rankings.length;
      const { data: keywords } = await supabase.from("keywords").select("volume").eq("project_id", p.id);
      const trafficPotential = keywords?.reduce((s: number, k: any) => s + (k.volume ?? 0), 0) ?? 0;
      const trafficScore = Math.min(100, trafficPotential / 100);
      const { data: briefs } = await supabase.from("content_briefs").select("status").eq("project_id", p.id);
      const contentScore = briefs && briefs.length > 0 ? (briefs.filter((b: any) => b.status === "published").length / briefs.length) * 100 : 0;
      const healthScore = avgRank ? Math.max(0, 100 - avgRank) * 0.4 + contentScore * 0.3 + trafficScore * 0.3 : 0;

      await supabase.from("project_stats").upsert({
        project_id: p.id,
        avg_rank: avgRank,
        keyword_count: rankings.length,
        traffic_potential: trafficPotential,
        health_score: Number((healthScore).toFixed(2)),
        last_updated: new Date(),
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("project-stats error:", err);
    return new Response(JSON.stringify({ error: err.message || "Project stats failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
