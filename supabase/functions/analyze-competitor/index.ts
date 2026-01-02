import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { domain, project_id, user_id } = await req.json();

    if (!domain || !project_id || !user_id) {
      throw new Error("Missing required fields: domain, project_id, or user_id");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Get competitor SERP results
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=site:${domain}&api_key=${Deno.env.get("SERP_API_KEY")}`
    );
    if (!serpResponse.ok) throw new Error(`SERP API failed: ${serpResponse.status}`);
    const serp = await serpResponse.json();
    const organics = serp.organic_results || [];
    const topOrganics = organics.slice(0, 10).map((r: any) => r.link);
    const sharedKeywords = organics.slice(0, 20).map((r: any) => r.title).filter(Boolean);
    const trafficEstimate = organics.reduce((sum: number, r: any) => sum + (r.position ? 100 / r.position : 0), 0);

    // 2️⃣ AI-based GAP extraction (with JSON mode for reliability)
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },  // ✅ Enforces JSON
        messages: [
          {
            role: "system",
            content: `You are a SEO expert. Analyze competitor titles and respond ONLY with this exact JSON format: {"gaps": ["gap keyword 1", "gap keyword 2"]}. No other text, explanations, or markdown. Extract 10-20 content gap keywords that the domain ${domain} ranks for but the user could target.`
          },
          {
            role: "user",
            content: `Titles from ${domain}: ${sharedKeywords.join(", ")}. Extract gaps as JSON array.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) throw new Error(`OpenAI failed: ${aiResponse.status}`);
    const ai = await aiResponse.json();
    if (!ai.choices?.[0]?.message?.content) {
      throw new Error("OpenAI returned no content");
    }

    // ✅ Robust JSON extraction & parsing
    let gaps: string[] = [];
    const content = ai.choices[0].message.content.trim();

    // Strip all possible markdown wrappers (multiple times for safety)
    let cleaned = content
      .replace(/^```json\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .replace(/^```\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .replace(/^json\s*\n?/, '')  // ✅ Fix for "json\n[" error
      .replace(/\n?```\s*$/, '')
      .trim();

    // If still object-wrapped (common with json_object), extract 'gaps' array
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      gaps = Array.isArray(parsed) ? parsed : (parsed.gaps || []);
    } catch (parseErr) {
      console.error("Parse failed, raw content:", cleaned);  // Log for debug
      gaps = [];  // Fallback empty
    }

    if (!Array.isArray(gaps)) gaps = [];

    // 3️⃣ Store result in DB
    const { error: dbError } = await supabase.from("competitors").insert({
      user_id,
      project_id,
      domain,
      top_organics: topOrganics,
      shared_keywords: sharedKeywords,
      gaps: gaps.slice(0, 15),
      traffic_estimate: Math.round(trafficEstimate),
    });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, gaps: gaps.slice(0, 3) }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("Edge function error:", error);  // ✅ Deno logs to Supabase dashboard
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
