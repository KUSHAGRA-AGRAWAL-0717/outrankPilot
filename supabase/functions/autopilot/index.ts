import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTION_API_VERSION = "2022-06-28";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🚀 Autopilot cycle started:", new Date().toISOString());

    // Get current UTC time
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    console.log(`Current UTC time: ${currentTime}`);

    // 1️⃣ Fetch autopilot-enabled projects matching current hour
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id, 
        user_id, 
        paused, 
        daily_publish_limit,
        autopilot_time,
        wp_url,
        wp_username,
        wp_app_password,
        notion_database_id,
        notion_token
      `)
      .eq("autopilot_enabled", true)
      .eq("paused", false);

    if (projectsError) {
      throw new Error(`Error fetching projects: ${projectsError.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log("No autopilot-enabled projects found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No projects with autopilot enabled",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter projects that should run now (matching hour from autopilot_time)
    const activeProjects = projects.filter(project => {
      const [projectHour] = (project.autopilot_time || "09:00").split(":");
      return parseInt(projectHour) === currentHour;
    });

    console.log(`Found ${activeProjects.length} projects scheduled for hour ${currentHour}`);

    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const project of activeProjects) {
      try {
        // 2️⃣ Check daily publish limit
        const { count: publishedToday } = await supabase
          .from("content_briefs")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("status", "published")
          .gte("published_at", today);

        const remaining = (project.daily_publish_limit || 1) - (publishedToday ?? 0);

        if (remaining <= 0) {
          console.log(`⏭️ Daily limit reached for project ${project.id} (${publishedToday}/${project.daily_publish_limit})`);
          results.push({
            projectId: project.id,
            status: "skipped",
            reason: "Daily limit reached",
            published: publishedToday,
            limit: project.daily_publish_limit
          });
          continue;
        }

        console.log(`Project ${project.id}: ${remaining} briefs remaining today`);

        // 3️⃣ Check if WordPress OR Notion is configured
        const hasWordPress = !!(project.wp_url && project.wp_username && project.wp_app_password);
        const hasNotion = !!(project.notion_database_id && project.notion_token);

        if (!hasWordPress && !hasNotion) {
          console.log(`⚠️ No publishing targets configured for project ${project.id}`);
          results.push({
            projectId: project.id,
            status: "error",
            reason: "No WordPress or Notion configured"
          });
          continue;
        }

        // 4️⃣ Find ONE generated brief (status='generated')
        const { data: briefs, error: briefsError } = await supabase
          .from("content_briefs")
          .select("id, title, content, meta_description, outline")
          .eq("project_id", project.id)
          .eq("status", "generated")
          .order("created_at", { ascending: true })
          .limit(1);

        if (briefsError) {
          throw new Error(`Error fetching briefs: ${briefsError.message}`);
        }

        if (!briefs || briefs.length === 0) {
          console.log(`📭 No generated briefs for project ${project.id}`);
          results.push({
            projectId: project.id,
            status: "completed",
            reason: "No more generated briefs to publish"
          });
          continue;
        }

        const brief = briefs[0];
        console.log(`📝 Publishing brief "${brief.title}" (${brief.id}) for project ${project.id}`);

        // 5️⃣ Parse content
        let parsedContent: any = {};
        try {
          parsedContent = typeof brief.content === "string" 
            ? JSON.parse(brief.content) 
            : brief.content;
        } catch (e) {
          console.error("Failed to parse content:", e);
        }

        // Parse outline
        let outline = [];
        try {
          if (parsedContent.outline) {
            outline = typeof parsedContent.outline === 'string' 
              ? JSON.parse(parsedContent.outline) 
              : parsedContent.outline;
          } else if (brief.outline) {
            outline = typeof brief.outline === 'string'
              ? JSON.parse(brief.outline)
              : brief.outline;
          }
        } catch (e) {
          console.error("Failed to parse outline:", e);
        }

        const metaDescription = parsedContent.metaDescription || parsedContent.meta_description || brief.meta_description;

        // Build HTML content from outline
        let htmlContent = "";
        if (Array.isArray(outline) && outline.length > 0) {
          htmlContent = outline.map((section: any) => {
            const tag = section.type || "h2";
            return `<${tag}>${section.heading || ""}</${tag}>\n<p>${section.notes || ""}</p>`;
          }).join("\n");
        }

        const publishResults: any = {};

        // 6️⃣ Publish to WordPress if configured
        if (hasWordPress) {
          try {
            console.log(`📤 Publishing to WordPress for project ${project.id}`);
            
            const wpAuth = btoa(`${project.wp_username}:${project.wp_app_password}`);
            const wpApiUrl = `${project.wp_url.replace(/\/$/, "")}/wp-json/wp/v2/posts`;

            const wpResponse = await fetch(wpApiUrl, {
              method: "POST",
              headers: {
                Authorization: `Basic ${wpAuth}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: brief.title,
                content: htmlContent || "",
                status: "draft",
                excerpt: metaDescription || "",
              }),
            });

            if (!wpResponse.ok) {
              const errorText = await wpResponse.text();
              throw new Error(`WordPress error: ${wpResponse.status} - ${errorText}`);
            }

            const wpPost = await wpResponse.json();
            publishResults.wordpress = {
              success: true,
              postId: wpPost.id,
              postUrl: wpPost.link
            };

            await supabase
              .from("content_briefs")
              .update({
                wp_post_id: wpPost.id,
                wp_post_url: wpPost.link,
              })
              .eq("id", brief.id);

            console.log(`✅ WordPress post created: ${wpPost.id}`);
          } catch (wpError) {
            console.error(`❌ WordPress publish error:`, wpError);
            publishResults.wordpress = {
              success: false,
              error: wpError instanceof Error ? wpError.message : "Unknown error"
            };
          }
        }

        // 7️⃣ Publish to Notion if configured
        if (hasNotion) {
          try {
            console.log(`📤 Publishing to Notion for project ${project.id}`);

            const blocks = [];
            
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

            if (Array.isArray(outline) && outline.length > 0) {
              for (const section of outline.slice(0, 50)) {
                if (!section || !section.heading) continue;
                
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
                  blocks.push({
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                      rich_text: [{
                        type: "text",
                        text: { content: String(section.notes).substring(0, 2000) },
                      }],
                    },
                  });
                }
              }
            }

            const notionPayload = {
              parent: { 
                type: "database_id",
                database_id: project.notion_database_id 
              },
              properties: {
                "Name": {
                  title: [{ text: { content: brief.title || "Untitled" } }],
                },
              },
              children: blocks.slice(0, 100),
            };

            const notionResponse = await fetch("https://api.notion.com/v1/pages", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${project.notion_token}`,
                "Content-Type": "application/json",
                "Notion-Version": NOTION_API_VERSION,
              },
              body: JSON.stringify(notionPayload),
            });

            if (!notionResponse.ok) {
              const errorText = await notionResponse.text();
              throw new Error(`Notion error: ${notionResponse.status} - ${errorText}`);
            }

            const notionPage = await notionResponse.json();
            publishResults.notion = {
              success: true,
              pageId: notionPage.id,
              pageUrl: notionPage.url
            };

            await supabase
              .from("content_briefs")
              .update({
                notion_page_id: notionPage.id,
                notion_database_id: project.notion_database_id,
              })
              .eq("id", brief.id);

            console.log(`✅ Notion page created: ${notionPage.id}`);
          } catch (notionError) {
            console.error(`❌ Notion publish error:`, notionError);
            publishResults.notion = {
              success: false,
              error: notionError instanceof Error ? notionError.message : "Unknown error"
            };
          }
        }

        // 8️⃣ Update brief status to "published"
        const publishSuccess = 
          (publishResults.wordpress?.success || !hasWordPress) &&
          (publishResults.notion?.success || !hasNotion);

        await supabase
          .from("content_briefs")
          .update({
            status: publishSuccess ? "published" : "generated",
            published_at: publishSuccess ? new Date().toISOString() : null,
          })
          .eq("id", brief.id);

        results.push({
          projectId: project.id,
          briefId: brief.id,
          briefTitle: brief.title,
          status: publishSuccess ? "published" : "partial",
          remaining: remaining - 1,
          ...publishResults
        });

        console.log(`✅ Brief ${brief.id} processing complete`);

      } catch (projectError) {
        console.error(`Error processing project ${project.id}:`, projectError);
        results.push({
          projectId: project.id,
          status: "error",
          error: projectError instanceof Error ? projectError.message : "Unknown error"
        });
      }
    }

    console.log("✅ Autopilot cycle completed. Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        timestamp: new Date().toISOString(),
        currentTime: currentTime,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Autopilot error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});