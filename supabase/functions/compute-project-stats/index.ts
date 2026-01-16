import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🔢 Computing project stats...");

    let requestedProjectId = null;
    try {
      const body = await req.json();
      requestedProjectId = body.project_id;
    } catch (e) {
      // No body, compute for all projects
    }

    let projectsQuery = supabase.from("projects").select("id, name");
    if (requestedProjectId) {
      projectsQuery = projectsQuery.eq("id", requestedProjectId);
    }
    
    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No projects to compute" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Computing stats for ${projects.length} project(s)`);

    const results = [];

    for (const project of projects) {
      try {
        console.log(`Processing: ${project.name}`);

        // Get keywords
        const { data: keywords } = await supabase
          .from("keywords")
          .select("id, volume")
          .eq("project_id", project.id);

        const keywordCount = keywords?.length || 0;

        // Get latest rankings (deduplicated by keyword_id)
        const { data: allRankings } = await supabase
          .from("rankings")
          .select("keyword_id, position, date")
          .eq("project_id", project.id)
          .order("date", { ascending: false });

        // Get only latest ranking per keyword
        const latestRankings = new Map<string, number>();
        allRankings?.forEach(ranking => {
          if (!latestRankings.has(ranking.keyword_id)) {
            latestRankings.set(ranking.keyword_id, ranking.position);
          }
        });

        // Calculate average rank
        let avgRank = null;
        if (latestRankings.size > 0) {
          const positions = Array.from(latestRankings.values());
          avgRank = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
        }

        // Calculate traffic potential (sum of volumes)
        const trafficPotential = keywords?.reduce(
          (sum, k) => sum + (k.volume || 0),
          0
        ) || 0;

        // Get content briefs
        const { data: briefs } = await supabase
          .from("content_briefs")
          .select("status")
          .eq("project_id", project.id);

        // Calculate content completion percentage
        let contentScore = 0;
        if (briefs && briefs.length > 0) {
          const publishedCount = briefs.filter(b => b.status === "published").length;
          contentScore = (publishedCount / briefs.length) * 100;
        }

        // ===== HEALTH SCORE CALCULATION (0-100) =====
        let healthScore = 0;
        
        // 1. Ranking Score (0-40 points)
        // Best position (1) = 40 points, Worst (100) = 0 points
        let rankingScore = 0;
        if (avgRank !== null && avgRank > 0) {
          // Linear scale: position 1 = 40, position 100 = 0
          rankingScore = Math.max(0, 40 * (1 - (avgRank - 1) / 99));
        }
        
        // 2. Content Score (0-30 points)
        // Based on percentage of published content
        const contentPoints = (contentScore / 100) * 30;
        
        // 3. Traffic Score (0-30 points)
        // Logarithmic scale for traffic potential
        // 1k searches = ~15 points, 10k = ~23 points, 100k+ = 30 points
        let trafficScore = 0;
        if (trafficPotential > 0) {
          // Use log scale: log10(traffic) normalized to 0-30
          trafficScore = Math.min(30, (Math.log10(trafficPotential) / Math.log10(100000)) * 30);
          // Ensure minimum score for any traffic
          trafficScore = Math.max(5, trafficScore);
        }
        
        // Combine all scores
        healthScore = rankingScore + contentPoints + trafficScore;
        
        // Clamp between 0-100
        healthScore = Math.max(0, Math.min(100, healthScore));

        console.log(`Stats for ${project.name}:`, {
          avgRank: avgRank?.toFixed(2),
          keywordCount,
          trafficPotential,
          healthScore: healthScore.toFixed(2),
          breakdown: {
            ranking: rankingScore.toFixed(1),
            content: contentPoints.toFixed(1),
            traffic: trafficScore.toFixed(1)
          }
        });

        // Upsert to database
        const { error: upsertError } = await supabase
          .from("project_stats")
          .upsert({
            project_id: project.id,
            avg_rank: avgRank ? parseFloat(avgRank.toFixed(2)) : null,
            keyword_count: keywordCount,
            traffic_potential: trafficPotential,
            health_score: parseFloat(healthScore.toFixed(2)),
            last_updated: new Date().toISOString(),
          }, {
            onConflict: "project_id"
          });

        if (upsertError) {
          console.error(`Upsert error:`, upsertError);
          throw upsertError;
        }

        results.push({
          project_id: project.id,
          success: true,
          stats: {
            avg_rank: avgRank,
            keyword_count: keywordCount,
            traffic_potential: trafficPotential,
            health_score: healthScore,
          }
        });

      } catch (projectError) {
        console.error(`Error processing ${project.id}:`, projectError);
        results.push({
          project_id: project.id,
          success: false,
          error: projectError instanceof Error ? projectError.message : "Unknown error"
        });
      }
    }

    console.log("✅ Computation completed");

    return new Response(
      JSON.stringify({
        success: true,
        processed: projects.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Computation failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
