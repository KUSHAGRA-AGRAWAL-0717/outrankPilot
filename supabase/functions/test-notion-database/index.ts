import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY")
    );

    // Validate auth first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse body SAFELY
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid JSON body - missing databaseId");
    }
    const { databaseId } = body;
    if (!databaseId) {
      throw new Error("Database ID is required in body");
    }

    // Get Notion access token
    const { data: notionAccount, error: notionError } = await supabase
      .from("notion_accounts")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    if (notionError || !notionAccount) {
      throw new Error("Notion account not connected");
    }

    // Test database access (requires integration connected to this DB in Notion)
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        "Authorization": `Bearer ${notionAccount.access_token}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (response.ok) {
      const db = await response.json();
      const dbName = db.title?.[0]?.plain_text || "Untitled";
      return new Response(
        JSON.stringify({ 
          success: true,
          databaseName: dbName,
          databaseId: db.id
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Database not found or integration lacks access");
    }
  } catch (error) {
    console.error("Error testing database:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
