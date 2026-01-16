import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🎯 Starting ranking tracking...");

    // Get request body
    let requestedProjectId = null;
    let requestedDate = new Date().toISOString().slice(0, 10);
    
    try {
      const body = await req.json();
      requestedProjectId = body.project_id;
      requestedDate = body.date || requestedDate;
    } catch (e) {
      // Use defaults
    }

    console.log(`Tracking rankings for date: ${requestedDate}`);

    // Fetch keywords
    let keywordsQuery = supabase
      .from("keywords")
      .select("id, keyword, project_id, projects(business_url)");
    
    if (requestedProjectId) {
      keywordsQuery = keywordsQuery.eq("project_id", requestedProjectId);
    }

    const { data: keywords, error: keywordsError } = await keywordsQuery;

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    if (!keywords || keywords.length === 0) {
      console.log("No keywords found to track");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No keywords to track"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${keywords.length} keywords to track`);

    const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
    if (!SERP_API_KEY) {
      throw new Error("SERP_API_KEY not configured");
    }

    const results = [];

    for (const keyword of keywords) {
      try {
        const projectUrl = keyword.projects?.business_url;
        if (!projectUrl) {
          console.log(`No URL configured for project ${keyword.project_id}, skipping keyword: ${keyword.keyword}`);
          continue;
        }

        // Extract domain from URL
        const domain = new URL(projectUrl).hostname.replace('www.', '');

        console.log(`Tracking "${keyword.keyword}" for domain: ${domain}`);

        // Call SERP API
        const serpUrl = `https://serpapi.com/search.json?` +
          `q=${encodeURIComponent(keyword.keyword)}` +
          `&engine=google` +
          `&api_key=${SERP_API_KEY}`;

        const serpResponse = await fetch(serpUrl);
        
        if (!serpResponse.ok) {
          throw new Error(`SERP API error: ${serpResponse.status}`);
        }

        const serpData = await serpResponse.json();
        const organicResults = serpData.organic_results || [];

        // Find position for this domain
        let position = null;
        let url = null;

        for (let i = 0; i < organicResults.length; i++) {
          const result = organicResults[i];
          if (result.link && result.link.includes(domain)) {
            position = result.position || (i + 1);
            url = result.link;
            break;
          }
        }

        if (position) {
          // Insert ranking
          const { error: insertError } = await supabase
            .from("rankings")
            .insert({
              project_id: keyword.project_id,
              keyword_id: keyword.id,
              position: position,
              url: url,
              date: requestedDate,
            });

          if (insertError) {
            // Check if it's a duplicate error (already tracked today)
            if (insertError.code === '23505') {
              console.log(`Already tracked: ${keyword.keyword} on ${requestedDate}`);
            } else {
              throw insertError;
            }
          } else {
            console.log(`✅ Tracked: "${keyword.keyword}" at position ${position}`);
          }

          results.push({
            keyword: keyword.keyword,
            position,
            url,
            success: true
          });
        } else {
          console.log(`❌ Not found in top 100: "${keyword.keyword}"`);
          results.push({
            keyword: keyword.keyword,
            position: null,
            found: false,
            success: true
          });
        }

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (keywordError) {
        console.error(`Error tracking keyword ${keyword.keyword}:`, keywordError);
        results.push({
          keyword: keyword.keyword,
          success: false,
          error: keywordError instanceof Error ? keywordError.message : "Unknown error"
        });
      }
    }

    console.log("✅ Ranking tracking completed");

    return new Response(
      JSON.stringify({
        success: true,
        tracked: results.filter(r => r.success && r.position).length,
        total: keywords.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("❌ Rankings tracking error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Rankings tracking failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
