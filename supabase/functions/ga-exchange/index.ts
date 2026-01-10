import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authorization and validate user FIRST
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

    // Now get the request body
    const { contentBriefId, databaseId } = await req.json();

    if (!contentBriefId) {
      throw new Error("Content brief ID is required");
    }

    if (!databaseId) {
      throw new Error("Database ID is required");
    }

    // Get content brief
    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", contentBriefId)
      .eq("user_id", user.id)
      .single();

    if (briefError || !brief) {
      throw new Error("Content brief not found");
    }

    // Get Notion account token
    const { data: notionAccount, error: notionError } = await supabase
      .from("notion_accounts")
      .select("access_token, workspace_id")
      .eq("user_id", user.id)
      .single();

    if (notionError || !notionAccount) {
      throw new Error("Notion account not connected");
    }

    // Prepare content blocks for Notion
    const contentBlocks = [];
    
    // Add title as heading
    contentBlocks.push({
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [{ text: { content: brief.title || "Untitled" } }],
      },
    });

    // Split content into paragraphs (Notion has 2000 char limit per block)
    const content = brief.content || "";
    const paragraphs = content.split("\n\n").filter(p => p.trim());
    
    for (const para of paragraphs) {
      if (para.length > 2000) {
        // Split long paragraphs
        const chunks = para.match(/.{1,2000}/g) || [];
        chunks.forEach(chunk => {
          contentBlocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: chunk } }],
            },
          });
        });
      } else {
        contentBlocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content: para } }],
          },
        });
      }
    }

    // Create Notion page
    const notionPayload = {
      parent: { 
        database_id: databaseId || brief.notion_database_id 
      },
      properties: {
        "Name": {
          title: [{ text: { content: brief.title || "Untitled" } }],
        },
      },
      children: contentBlocks.slice(0, 100), // Notion limit
    };

    // Add optional properties if they exist
    if (brief.wp_post_url) {
      notionPayload.properties["URL"] = {
        url: brief.wp_post_url,
      };
    }

    const pageResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionAccount.access_token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    });

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();
      console.error("Notion API error:", errorText);
      throw new Error(`Failed to create Notion page: ${errorText}`);
    }

    const page = await pageResponse.json();

    // Update content brief with Notion page info
    const { error: updateError } = await supabase
      .from("content_briefs")
      .update({
        notion_page_id: page.id,
        publish_status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", contentBriefId);

    if (updateError) {
      console.error("Failed to update brief:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        pageId: page.id,
        pageUrl: page.url 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error publishing to Notion:", error);
    
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