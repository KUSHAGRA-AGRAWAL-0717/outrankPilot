import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ FIXED: Include ALL required headers for Supabase client
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("generate-brief payload:", JSON.stringify(payload));
    
    const keyword = payload.keyword;
    const keywordId = payload.keyword_id;
    const projectId = payload.project_id;
    const userId = payload.user_id;

    if (!keyword || !keywordId || !projectId || !userId) {
      console.error("Missing fields. Payload:", JSON.stringify(payload));
      return new Response(
        JSON.stringify({ error: "Missing required fields", received: payload }), 
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check subscription status
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (!sub || sub.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Subscription inactive" }), 
        { status: 403, headers: corsHeaders }
      );
    }

    // Generate content brief with AI
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
            content: `Generate a comprehensive SEO content brief for the keyword: "${keyword}". 
Respond ONLY with valid JSON in this exact format:
{
  "title": "SEO-optimized title (60 chars max)",
  "meta_description": "Compelling description (150-160 chars)", 
  "h1": "Main heading for the content",
  "sections": ["Section 1 heading", "Section 2 heading", "Section 3 heading"],
  "word_count": 1500,
  "primary_keyword": "${keyword}",
  "secondary_keywords": ["related keyword 1", "related keyword 2", "related keyword 3"],
  "outline": {
    "introduction": "Brief intro summary",
    "main_points": ["Point 1", "Point 2", "Point 3"],
    "conclusion": "Conclusion summary"
  }
}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!openaiResp.ok) {
      throw new Error(`OpenAI error: ${openaiResp.status}`);
    }
    
    const aiJson = await openaiResp.json();

    // Parse AI response
    let parsedBrief = {
      title: `${keyword} - Content Brief`,
      meta_description: `Comprehensive guide about ${keyword}`,
      word_count: 1500,
      content: "Brief generation successful",
    };

    const content = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = content
      .replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
      .replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
      .trim();

    try {
      parsedBrief = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
    }

    // Insert content brief
    const { data: briefData, error: insertError } = await supabase
      .from("content_briefs")
      .insert({
        title: parsedBrief.title,
        project_id: projectId,
        user_id: userId,
        keyword_id: keywordId,
        content: JSON.stringify(parsedBrief),
        word_count: parsedBrief.word_count || 1500,
        outline: parsedBrief.outline ? JSON.stringify(parsedBrief.outline) : null,
        meta_description: parsedBrief.meta_description || null,
        status: "generated",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Update keyword status to 'generated'
    const { error: updateError } = await supabase
      .from("keywords")
      .update({ status: "generated" })
      .eq("id", keywordId);

    if (updateError) throw updateError;

    // ✅ Return with CORS headers
    return new Response(
      JSON.stringify({ 
        success: true, 
        brief: parsedBrief.title,
        brief_id: briefData.id 
      }), 
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("generate-brief error:", err);
    
    // Try to revert keyword status on error
    try {
      const payload = await req.clone().json();
      if (payload.keyword_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!, 
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("keywords")
          .update({ status: "ready" })
          .eq("id", payload.keyword_id);
      }
    } catch {}
    
    // ✅ Return error with CORS headers
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
