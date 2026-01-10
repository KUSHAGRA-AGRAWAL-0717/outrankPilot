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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🚀 Autopilot cycle started:", new Date().toISOString());

    // 1️⃣ Fetch autopilot-enabled projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id, 
        user_id, 
        paused, 
        daily_publish_limit,
        wp_url,
        wp_username,
        wp_app_password,
        notion_database_id
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

    console.log(`Found ${projects.length} autopilot-enabled projects`);

    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const project of projects) {
      try {
        // 2️⃣ Check daily publish limit
        const { count: publishedToday } = await supabase
          .from("content_briefs")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("publish_status", "published")
          .gte("published_at", today);

        if ((publishedToday ?? 0) >= (project.daily_publish_limit || 1)) {
          console.log(`⏭️ Daily limit reached for project ${project.id} (${publishedToday}/${project.daily_publish_limit})`);
          results.push({
            projectId: project.id,
            status: "skipped",
            reason: "Daily limit reached"
          });
          continue;
        }

        // 3️⃣ Check if WordPress OR Notion is configured
        const hasWordPress = !!(project.wp_url && project.wp_username && project.wp_app_password);
        const hasNotion = !!project.notion_database_id;

        if (!hasWordPress && !hasNotion) {
          console.log(`⚠️ No publishing targets configured for project ${project.id}`);
          results.push({
            projectId: project.id,
            status: "skipped",
            reason: "No WordPress or Notion configured"
          });
          continue;
        }

        // 4️⃣ Find generated briefs (not yet published)
        const { data: briefs, error: briefsError } = await supabase
          .from("content_briefs")
          .select("id, title, content, meta_description, user_id")
          .eq("project_id", project.id)
          .eq("status", "generated")
          .is("publish_status", null)
          .limit(1);

        if (briefsError) {
          throw new Error(`Error fetching briefs: ${briefsError.message}`);
        }

        if (!briefs || briefs.length === 0) {
          console.log(`📭 No unpublished briefs for project ${project.id}`);
          results.push({
            projectId: project.id,
            status: "skipped",
            reason: "No unpublished briefs"
          });
          continue;
        }

        const brief = briefs[0];
        console.log(`📝 Publishing brief "${brief.title}" (${brief.id}) for project ${project.id}`);

        // 5️⃣ Parse content
        let content = brief.content;
        let metaDescription = brief.meta_description;

        if (typeof content === "string") {
          try {
            const parsed = JSON.parse(content);
            if (parsed.outline) {
              content = parsed.outline
                .map((section: any) => {
                  const tag = section.type || "h2";
                  return `<${tag}>${section.heading}</${tag}>\n<p>${section.notes || ""}</p>`;
                })
                .join("\n");
            }
            if (parsed.metaDescription) {
              metaDescription = parsed.metaDescription;
            }
          } catch (e) {
            // Use content as-is
          }
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
                content: content || "",
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

            // Update brief with WordPress info
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

            // Get Notion account
            const { data: notionAccount } = await supabase
              .from("notion_accounts")
              .select("access_token")
              .eq("user_id", project.user_id)
              .single();

            if (!notionAccount) {
              throw new Error("Notion account not found");
            }

            // Prepare content blocks
            const contentBlocks = [];
            
            contentBlocks.push({
              object: "block",
              type: "heading_1",
              heading_1: {
                rich_text: [{ text: { content: brief.title || "Untitled" } }],
              },
            });

            const textContent = typeof content === "string" ? content : JSON.stringify(content);
            const paragraphs = textContent.split("\n\n").filter(p => p.trim());
            
            for (const para of paragraphs.slice(0, 50)) {
              if (para.length > 2000) {
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
              parent: { database_id: project.notion_database_id },
              properties: {
                "Name": {
                  title: [{ text: { content: brief.title || "Untitled" } }],
                },
              },
              children: contentBlocks,
            };

            if (publishResults.wordpress?.postUrl) {
              notionPayload.properties["URL"] = {
                url: publishResults.wordpress.postUrl,
              };
            }

            const notionResponse = await fetch("https://api.notion.com/v1/pages", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${notionAccount.access_token}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28",
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

            // Update brief with Notion info
            await supabase
              .from("content_briefs")
              .update({
                notion_page_id: notionPage.id,
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

        // 8️⃣ Update brief status
        const publishSuccess = 
          (publishResults.wordpress?.success || !hasWordPress) &&
          (publishResults.notion?.success || !hasNotion);

        await supabase
          .from("content_briefs")
          .update({
            publish_status: publishSuccess ? "published" : "failed",
            published_at: publishSuccess ? new Date().toISOString() : null,
          })
          .eq("id", brief.id);

        results.push({
          projectId: project.id,
          briefId: brief.id,
          status: publishSuccess ? "published" : "partial",
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