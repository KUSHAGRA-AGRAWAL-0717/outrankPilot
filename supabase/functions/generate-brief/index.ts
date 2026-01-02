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

  try {
    const payload = await req.json();
    console.log("generate-brief payload:", JSON.stringify(payload));  // Debug log
    // ✅ Flexible destructuring - handles camelCase OR snake_case from worker/frontend
    const keyword = payload.keyword || payload.keyword_id;
    const keywordId = payload.keywordId || payload.keyword_id;
    const projectId = payload.projectId || payload.project_id;
    const userId = payload.userId || payload.user_id;

    if (!keyword || !keywordId || !projectId || !userId) {
      console.error("Missing fields. Payload:", JSON.stringify(payload));  // Debug log
      return new Response(JSON.stringify({ error: "Missing fields", received: payload }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Subscription check (keep as-is)
    const { data: sub } = await supabase.from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription inactive" }), { status: 403, headers: corsHeaders });
    }

    // Enhanced brief generation (robust JSON mode)
    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Generate SEO content brief for "${keyword}". Respond ONLY with valid JSON: {
  "title": "Optimized page title",
  "meta_description": "150 char description", 
  "h1": "Main heading",
  "sections": ["Section 1 title", "Section 2 title"],
  "word_count": 1500,
  "primary_keyword": "${keyword}",
  "secondary_keywords": ["keyword1", "keyword2"]
}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!openaiResp.ok) throw new Error(`OpenAI error: ${openaiResp.status}`);
    const aiJson = await openaiResp.json();

    // Robust parsing
    let parsedBrief = {
      title: `${keyword} - Content Brief`,
      content: "Brief generation successful",
    };

    const content = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let cleaned = content
      .replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
      .replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
      .trim();

    try {
      const briefObj = JSON.parse(cleaned);
      parsedBrief = briefObj;
    } catch {}

    // Insert brief
    await supabase.from("content_briefs").insert({
  title: parsedBrief.title,
  project_id: projectId,
  user_id: userId,
  keyword_id: keywordId,
  content: JSON.stringify(parsedBrief),  // Keep full JSON
  word_count: parsedBrief.word_count || 0,
  outline: parsedBrief.outline ? JSON.stringify(parsedBrief.outline) : null,
  meta_description: parsedBrief.meta_description || null,
  status: "generated",
}).select("id").single();

    // Update keywords status to 'generated'
await supabase
  .from("keywords")
  .update({ status: 'generated' })  // ✅ Uses existing status column
  .eq("id", keywordId);


    if (error) throw error;

    return new Response(JSON.stringify({ success: true, brief: parsedBrief.title }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("generate-brief error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
