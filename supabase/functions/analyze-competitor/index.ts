import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { domain, project_id, user_id } = await req.json();

    if (!domain || !project_id || !user_id) {
      throw new Error("Missing required fields: domain, project_id, or user_id");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Analyzing competitor: ${domain}`);

    // 1️⃣ Get competitor SERP results
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=site:${domain}&num=100&api_key=${Deno.env.get("SERP_API_KEY")}`
    );
    
    if (!serpResponse.ok) {
      throw new Error(`SERP API failed: ${serpResponse.status}`);
    }
    
    const serp = await serpResponse.json();
    const organics = serp.organic_results || [];
    
    // Extract top organic URLs
    const topOrganics = organics
      .slice(0, 20)
      .map((r: any) => ({
        url: r.link,
        title: r.title,
        position: r.position,
      }));
    
    // Extract shared keywords from titles
    const sharedKeywords = organics
      .slice(0, 30)
      .map((r: any) => r.title)
      .filter(Boolean);
    
    // Calculate traffic estimate based on positions
    const trafficEstimate = organics.reduce(
      (sum: number, r: any) => {
        const position = r.position || 100;
        // CTR-based estimate: position 1 = ~30%, position 10 = ~2%
        const ctr = position <= 10 
          ? Math.max(2, 30 - (position - 1) * 3) 
          : 1;
        return sum + ctr * 10; // Multiply by average search volume factor
      }, 
      0
    );

    // 2️⃣ Get backlink data (optional - if you have a backlink API)
    let backlinkCount = 0;
    let referringDomains = 0;
    
    // Example: If you use Ahrefs or Moz API
    // const backlinkData = await fetchBacklinkData(domain);
    // backlinkCount = backlinkData.total;
    // referringDomains = backlinkData.referring_domains;

    // 3️⃣ AI-based keyword gap extraction
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an SEO competitor analysis expert. Analyze the following page titles from ${domain} and extract 15-20 high-value keyword opportunities that represent content gaps.

Focus on:
- Informational keywords (how-to, guide, tutorial)
- Commercial keywords (best, top, review, vs)
- Long-tail opportunities
- Question-based queries

Respond ONLY with valid JSON in this exact format:
{
  "gaps": ["keyword 1", "keyword 2", "keyword 3", ...]
}

No explanations, no markdown, just the JSON object.`
          },
          {
            role: "user",
            content: `Page titles from ${domain}:\n${sharedKeywords.slice(0, 30).join("\n")}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI failed: ${aiResponse.status}`);
    }
    
    const ai = await aiResponse.json();
    
    if (!ai.choices?.[0]?.message?.content) {
      throw new Error("OpenAI returned no content");
    }

    // Parse AI response with robust error handling
    let gaps: string[] = [];
    const content = ai.choices[0].message.content.trim();

    // Clean markdown wrappers
    let cleaned = content
      .replace(/^```json\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .replace(/^```\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .replace(/^json\s*\n?/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      gaps = Array.isArray(parsed) ? parsed : (parsed.gaps || []);
    } catch (parseErr) {
      console.error("JSON parse error. Raw content:", cleaned);
      gaps = [];
    }

    if (!Array.isArray(gaps)) {
      gaps = [];
    }

    // Filter and clean gaps
    gaps = gaps
      .filter((gap: string) => gap && gap.length > 3 && gap.length < 100)
      .slice(0, 20);

    console.log(`Found ${gaps.length} keyword gaps for ${domain}`);

    // 4️⃣ Store comprehensive competitor data
    const { data: competitorData, error: dbError } = await supabase
      .from("competitors")
      .insert({
        user_id,
        project_id,
        domain,
        top_organics: topOrganics,
        shared_keywords: sharedKeywords.slice(0, 30),
        gaps: gaps,
        traffic_estimate: Math.round(trafficEstimate),
        // backlink_count: backlinkCount,
        // referring_domains: referringDomains,
        // gaps_added: false,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        competitor: competitorData,
        gaps: gaps.slice(0, 5),
        stats: {
          traffic_estimate: Math.round(trafficEstimate),
          shared_keywords: sharedKeywords.length,
          top_pages: topOrganics.length,
          keyword_gaps: gaps.length,
        }
      }), 
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Competitor analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
