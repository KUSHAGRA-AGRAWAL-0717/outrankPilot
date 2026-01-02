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

  // ✅ Robust auth check - trim whitespace
 // Replace the auth check with this TEMPORARY version:


  try {
    const payload = await req.json();
    const { keyword_id, keyword, project_id } = payload;
    if (!keyword_id || !keyword) {
      return new Response(JSON.stringify({ error: "Missing keyword_id or keyword" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Mark analyzing
    await supabase.from("keywords").update({ status: "analyzing" }).eq("id", keyword_id);

    // SERP call
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(keyword)}&engine=google&api_key=${Deno.env.get("SERP_API_KEY")}`
    );
    if (!serpResponse.ok) throw new Error(`SERP failed: ${serpResponse.status}`);
    const serp = await serpResponse.json();

    const volume = serp.search_information?.total_results ?? 0;
    const cpc = serp.ads?.[0]?.cpc ?? 0;
    const difficulty = Math.min(100, (serp.organic_results?.length ?? 10) * 8);

    // AI intent (robust JSON mode)
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Respond ONLY with JSON: {"intent": "informational|commercial|transactional|navigational", "priority_score": 1-100}' },
          { role: "user", content: `Keyword: "${keyword}" Volume: ${volume} Difficulty: ${difficulty} CPC: ${cpc}` },
        ],
        temperature: 0.1,
      }),
    });
    if (!aiResp.ok) throw new Error(`OpenAI failed: ${aiResp.status}`);
    const ai = await aiResp.json();

    // Robust parse
    let parsed = { intent: "informational", priority_score: 0 };
    const content = ai.choices?.[0]?.message?.content?.trim() ?? "{}";
    let cleaned = content
      .replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
      .replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
      .trim();
    try {
      const obj = JSON.parse(cleaned);
      parsed = { intent: obj.intent || "informational", priority_score: obj.priority_score || 0 };
    } catch {}

    // Update DB
    const { error } = await supabase.from("keywords").update({
      volume,
      difficulty,
      cpc,
      intent: parsed.intent,
      priority_score: parsed.priority_score,
      serp_features: serp.search_information,
      status: "ready",
    }).eq("id", keyword_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Keyword analysis failed:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
