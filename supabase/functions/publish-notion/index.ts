import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_API_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, contentBriefId, databaseId, notionToken } = await req.json();

    if (!databaseId || !notionToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: databaseId and notionToken",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Test database access
    if (action === "test") {
      const testResult = await testNotionDatabase(databaseId, notionToken);
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Publish content
    if (action === "publish") {
      if (!contentBriefId) {
        return new Response(
          JSON.stringify({ success: false, error: "contentBriefId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await publishToNotion(contentBriefId, databaseId, notionToken, req);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function testNotionDatabase(databaseId: string, notionToken: string) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Test database error:", error);
      return {
        success: false,
        error: error.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const database = await response.json();
    console.log("Database properties:", Object.keys(database.properties || {}));
    
    return {
      success: true,
      databaseTitle: database.title?.[0]?.plain_text || "Untitled Database",
      databaseId: database.id,
      properties: Object.keys(database.properties || {}),
    };
  } catch (error) {
    console.error("Test connection error:", error);
    return {
      success: false,
      error: `Connection failed: ${error.message}`,
    };
  }
}

async function publishToNotion(
  contentBriefId: string,
  databaseId: string,
  notionToken: string,
  req: Request
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch content brief
    console.log("Fetching brief:", contentBriefId);
    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", contentBriefId)
      .single();

    if (briefError || !brief) {
      console.error("Brief fetch error:", briefError);
      return { success: false, error: "Content brief not found" };
    }

    console.log("Brief fetched successfully:", brief.title);

    // Parse content JSON
    let parsedContent;
    try {
      parsedContent = typeof brief.content === "string" 
        ? JSON.parse(brief.content) 
        : brief.content;
    } catch (e) {
      console.error("Failed to parse content:", e);
      parsedContent = { title: brief.title };
    }

    // First, get database schema to understand what properties exist
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
    });

    if (!dbResponse.ok) {
      const error = await dbResponse.json();
      console.error("Database fetch error:", error);
      return { success: false, error: "Failed to fetch database schema" };
    }

    const database = await dbResponse.json();
    console.log("Database properties:", Object.keys(database.properties));

    // Create Notion page
    const notionPage = await createNotionPage(
      databaseId,
      notionToken,
      brief.title,
      parsedContent,
      brief,
      database.properties
    );

    if (!notionPage.success) {
      console.error("Page creation failed:", notionPage.error);
      return notionPage;
    }

    console.log("Page created successfully:", notionPage.pageId);

    // Update content_briefs table
    const { error: updateError } = await supabase
      .from("content_briefs")
      .update({
        notion_page_id: notionPage.pageId,
        notion_database_id: databaseId,
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentBriefId);

    if (updateError) {
      console.error("Failed to update brief:", updateError);
    }

    return {
      success: true,
      pageId: notionPage.pageId,
      pageUrl: notionPage.pageUrl,
    };
  } catch (error) {
    console.error("Publish error:", error);
    return { success: false, error: error.message };
  }
}

async function createNotionPage(
  databaseId: string,
  notionToken: string,
  title: string,
  parsedContent: any,
  brief: any,
  databaseProperties: any
) {
  try {
    console.log("Creating page with title:", title);
    
    // Extract and properly parse data from content
    const metaDescription = parsedContent.metaDescription || parsedContent.meta_description || brief.meta_description;
    
    // CRITICAL FIX: Parse outline if it's a JSON string
    let outline = [];
    try {
      // Check parsedContent.outline first
      if (parsedContent.outline) {
        if (typeof parsedContent.outline === 'string') {
          outline = JSON.parse(parsedContent.outline);
        } else if (Array.isArray(parsedContent.outline)) {
          outline = parsedContent.outline;
        }
      }
      // Fallback to brief.outline
      else if (brief.outline) {
        if (typeof brief.outline === 'string') {
          outline = JSON.parse(brief.outline);
        } else if (Array.isArray(brief.outline)) {
          outline = brief.outline;
        }
      }
    } catch (e) {
      console.error("Failed to parse outline:", e);
      outline = [];
    }
    
    // Parse key points similarly
    let keyPoints = [];
    try {
      if (parsedContent.keyPoints) {
        if (typeof parsedContent.keyPoints === 'string') {
          keyPoints = JSON.parse(parsedContent.keyPoints);
        } else if (Array.isArray(parsedContent.keyPoints)) {
          keyPoints = parsedContent.keyPoints;
        }
      }
    } catch (e) {
      console.error("Failed to parse keyPoints:", e);
      keyPoints = [];
    }
    
    console.log("Parsed outline sections:", outline.length);
    console.log("Parsed key points:", keyPoints.length);
    
    // Build content blocks
    const blocks = [];
    
    // Add meta description as callout
    if (metaDescription) {
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          icon: { type: "emoji", emoji: "📝" },
          rich_text: [{
            type: "text",
            text: { content: String(metaDescription).substring(0, 2000) },
          }],
          color: "blue_background",
        },
      });
    }

    // Add content overview section
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "📊 Content Details" } }],
      },
    });

    // Add metadata
    const metadataItems = [
      `Word Count: ${brief.word_count || 0}`,
      `Status: ${brief.status || 'draft'}`,
      `Created: ${new Date(brief.created_at).toLocaleDateString()}`,
    ];

    for (const item of metadataItems) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
        },
      });
    }

    // Add key points if available
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "🎯 Key Points" } }],
        },
      });

      for (const point of keyPoints.slice(0, 10)) {
        if (point) {
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ type: "text", text: { content: String(point).substring(0, 2000) } }],
            },
          });
        }
      }
    }

    // Add divider
    blocks.push({
      object: "block",
      type: "divider",
      divider: {},
    });

    // Add outline content with proper validation
    if (Array.isArray(outline) && outline.length > 0) {
      console.log("Adding outline sections to blocks...");
      for (const section of outline.slice(0, 30)) {
        if (!section || !section.heading) {
          console.log("Skipping invalid section:", section);
          continue;
        }
        
        const headingType = section.type === "h1" ? "heading_1" : 
                           section.type === "h2" ? "heading_2" : "heading_3";
        
        blocks.push({
          object: "block",
          type: headingType,
          [headingType]: {
            rich_text: [{
              type: "text",
              text: { content: String(section.heading).substring(0, 2000) },
            }],
          },
        });

        if (section.notes) {
          const noteText = String(section.notes).substring(0, 2000);
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{
                type: "text",
                text: { content: noteText },
              }],
            },
          });
        }
      }
    } else {
      console.log("No valid outline found, adding placeholder");
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{
            type: "text",
            text: { content: "Content outline will be displayed here once generated." },
          }],
        },
      });
    }

    // Build properties dynamically based on database schema
    const properties: any = {};
    
    // Find title property (could be "Name", "Title", etc.)
    const titleProp = Object.entries(databaseProperties).find(
      ([_, prop]: any) => prop.type === "title"
    );
    
    if (titleProp) {
      const [titlePropName] = titleProp;
      properties[titlePropName] = {
        title: [{
          text: { content: String(title).substring(0, 2000) },
        }],
      };
    } else {
      // Fallback to "Name"
      properties["Name"] = {
        title: [{
          text: { content: String(title).substring(0, 2000) },
        }],
      };
    }

    console.log("Properties to send:", Object.keys(properties));
    console.log("Total blocks created:", blocks.length);

    // Limit blocks to 100 (Notion API limit)
    const blocksToSend = blocks.slice(0, 100);

    const payload = {
      parent: {
        type: "database_id",
        database_id: databaseId,
      },
      properties: properties,
      children: blocksToSend,
    };

    console.log("Sending payload with", blocksToSend.length, "blocks");

    // Create the page
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Notion API error response:", JSON.stringify(responseData, null, 2));
      return {
        success: false,
        error: responseData.message || `Failed to create page: ${response.statusText}`,
      };
    }

    console.log("Page created successfully:", responseData.id);
    
    return {
      success: true,
      pageId: responseData.id,
      pageUrl: responseData.url,
    };
  } catch (error) {
    console.error("Create page error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
