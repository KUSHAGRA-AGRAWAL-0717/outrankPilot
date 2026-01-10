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
    console.error("Token fetch error:", error);
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
    console.log("ga-properties: Starting...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    console.log("ga-properties: Getting user...");

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("User auth error:", userError);
      throw new Error("Not authenticated");
    }

    console.log("ga-properties: User authenticated:", user.id);

    const accessToken = await getValidAccessToken(supabase, user.id);

    console.log("ga-properties: Fetching account summaries...");

    const res = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("GA Admin API error:", res.status, errorText);
      throw new Error(`GA API error: ${res.status}`);
    }

    const accounts = await res.json();

    console.log("ga-properties: Success, found", accounts.accountSummaries?.length || 0, "accounts");

    return new Response(JSON.stringify(accounts), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("ga-properties ERROR:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error",
      details: error.toString()
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});