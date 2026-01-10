import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getValidAccessToken(supabase: any, userId: string) {
  const { data: tokens, error } = await supabase
    .from("google_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokens) {
    throw new Error("Google account not connected");
  }

  // Check if token is expired
  if (new Date(tokens.expires_at) < new Date()) {
    console.log("Token expired, refreshing...");

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const newTokens = await refreshRes.json();

    if (newTokens.error) {
      console.error("Token refresh error:", newTokens);
      throw new Error(newTokens.error_description || "Failed to refresh token");
    }

    // Update tokens in database
    const expiresAt = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000);
    await supabase.from("google_accounts").update({
      access_token: newTokens.access_token,
      expires_at: expiresAt.toISOString(),
    }).eq("user_id", userId);

    return newTokens.access_token;
  }

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { projectId, days = 30 } = await req.json();

    if (!projectId) {
      throw new Error("projectId is required");
    }

    console.log("Fetching GA report for project:", projectId, "days:", days);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get project with user_id and ga_property_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id, ga_property_id, ga_connected")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Project fetch error:", projectError);
      throw new Error("Project not found");
    }

    if (!project.ga_connected) {
      throw new Error("Google Analytics not connected for this project");
    }

    if (!project.ga_property_id) {
      throw new Error("GA property not selected. Please select a property first.");
    }

    console.log("Project found:", project);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, project.user_id);

    console.log("Fetching analytics data from Google...");

    // Fetch analytics data
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${project.ga_property_id}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          dimensions: [{ name: "date" }],
        }),
      }
    );

    if (!reportRes.ok) {
      const errorText = await reportRes.text();
      console.error("GA API Error:", reportRes.status, errorText);
      throw new Error(`GA API error: ${reportRes.status} - ${errorText}`);
    }

    const reportData = await reportRes.json();

    console.log("Report data received:", reportData);

    // Calculate totals
    const totalSessions = reportData.rows?.reduce(
      (sum: number, r: any) => sum + Number(r.metricValues?.[0]?.value || 0),
      0
    ) || 0;

    const totalUsers = reportData.rows?.reduce(
      (sum: number, r: any) => sum + Number(r.metricValues?.[1]?.value || 0),
      0
    ) || 0;

    const response = {
      sessions: totalSessions,
      users: totalUsers,
      rows: reportData.rows || [],
      dimensionHeaders: reportData.dimensionHeaders || [],
      metricHeaders: reportData.metricHeaders || [],
    };

    console.log("Returning response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("GA REPORT ERROR:", error);

    return new Response(JSON.stringify({
      error: error.message || "Unknown error occurred",
      details: error.toString(),
      stack: error.stack || null
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});