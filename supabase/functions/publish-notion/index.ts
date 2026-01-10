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
    // SINGLE Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY")
    );

    // Auth first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) throw new Error("Unauthorized");

    // Parse body SAFELY
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid JSON body");
    }
    const { contentBriefId, databaseId } = body;
    if (!contentBriefId) throw new Error("contentBriefId required");
    if (!databaseId) throw new Error("databaseId required");

    // Get content brief (ensure user owns it)
    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", contentBriefId)
      .eq("user_id", user.id)
      .single();
    if (briefError || !brief) throw new Error("Content brief not found");

    // Get Notion token
    const { data: notionAccount, error: notionError } = await supabase
      .from("notion_accounts")
      .select("access_token")
      .eq("user_id", user.id)
      .single();
    if (notionError || !notionAccount) throw new Error("Notion not connected");

    // Build blocks (title + paragraphs)
    const contentBlocks = [
      {
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ text: { content: brief.title || "Untitled" } }] }
      }
    ];
    const paragraphs = (brief.content || "").split("\n\n").filter(p => p.trim());
    for (const para of paragraphs) {
      const text = para.length > 2000 ? para.match(/.{1,2000}/g) || [] : [para];
      text.forEach(chunk => contentBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ text: { content: chunk } }] }
      }));
    }

    // FIXED: Database page properties format [web:11]
    const notionPayload = {
      parent: { database_id: databaseId },
      properties: {
        Name: {  // Title property MUST be "Name" for databases
          title: [{ text: { content: brief.title || "Untitled" } }]
        }
      },
      children: contentBlocks.slice(0, 100)
    };

    // Optional URL property
    if (brief.wp_post_url) {
      notionPayload.properties.URL = { url: brief.wp_post_url };
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
      throw new Error(`Notion API error: ${errorText}`);
    }

    const page = await pageResponse.json();

    // Update brief
    await supabase
      .from("content_briefs")
      .update({
        notion_page_id: page.id,
        publish_status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", contentBriefId);

    return new Response(
      JSON.stringify({ success: true, pageId: page.id, pageUrl: page.url }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Publish error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
