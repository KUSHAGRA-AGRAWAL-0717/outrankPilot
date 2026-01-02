import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { project_id, date } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = date ?? new Date().toISOString().slice(0, 10);

    // fetch keywords for project (or all projects if project_id not provided)
    const q = supabase.from("keywords").select("id, keyword, project_id");
    if (project_id) q.eq("project_id", project_id);
    const { data: keywords } = await q;

    for (const k of keywords ?? []) {
      const { data: project } = await supabase.from("projects").select("domain").eq("id", k.project_id).maybeSingle();
      if (!project?.domain) continue;

      const serp = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(k.keyword)}&engine=google&api_key=${Deno.env.get("SERP_API_KEY")}`).then(r => r.json());
      const results = serp.organic_results || [];
      const found = results.find((r: any) => r.link?.includes(project.domain));
      const position = found?.position ?? null;

      if (position) {
        await supabase.from("rankings").insert({ project_id: k.project_id, keyword_id: k.id, position, date: today });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("rankings error:", err);
    return new Response(JSON.stringify({ error: err.message || "Rankings failed" }), { status: 500, headers: corsHeaders });
  }
});
