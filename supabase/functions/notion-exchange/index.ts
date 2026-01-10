import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, projectId, userId } = await req.json();

    if (!code) {
      throw new Error("Authorization code is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header and validate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Authorization header required" 
        }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Unauthorized - invalid token" 
        }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the authenticated user's ID instead of relying on userId from request
    const authenticatedUserId = user.id;

    console.log("Exchanging Notion code for token...");

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${Deno.env.get("NOTION_CLIENT_ID")}:${Deno.env.get("NOTION_CLIENT_SECRET")}`)}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${req.headers.get("origin") || Deno.env.get("APP_URL")}/auth/notion/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Notion token exchange failed:", errorText);
      throw new Error(`Failed to exchange code: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("No access token received from Notion");
    }

    console.log("Token received, fetching workspace info...");

    // Get workspace information
    const botResponse = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        "Authorization": `Bearer ${tokens.access_token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    const botInfo = await botResponse.json();
    
    console.log("Workspace info received, storing in database...");

    // Store or update Notion account
    const { data: existingAccount } = await supabase
      .from("notion_accounts")
      .select("id")
      .eq("user_id", authenticatedUserId)
      .maybeSingle();

    const accountData = {
      user_id: authenticatedUserId,
      access_token: tokens.access_token,
      workspace_id: tokens.workspace_id,
      workspace_name: tokens.workspace_name || botInfo.name || "Unknown Workspace",
      workspace_icon: tokens.workspace_icon || null,
      bot_id: tokens.bot_id,
      owner_user_id: tokens.owner?.user?.id || null,
    };

    let result;
    if (existingAccount) {
      result = await supabase
        .from("notion_accounts")
        .update(accountData)
        .eq("id", existingAccount.id);
    } else {
      result = await supabase
        .from("notion_accounts")
        .insert(accountData);
    }

    if (result.error) {
      console.error("Database error:", result.error);
      throw new Error(`Failed to store Notion connection: ${result.error.message}`);
    }

    console.log("Notion account stored successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        workspace_name: accountData.workspace_name 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notion-exchange:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Unknown error occurred"
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});