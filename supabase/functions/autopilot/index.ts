// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
// };

// serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === "OPTIONS") {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     // Use service role key for cron jobs
//     const supabaseClient = createClient(
//       Deno.env.get("SUPABASE_URL")!,
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
//       {
//         auth: {
//           persistSession: false,
//           autoRefreshToken: false,
//         },
//       }
//     );

//     console.log("Autopilot job started at:", new Date().toISOString());

//     // Get all projects with autopilot enabled
//     const { data: projects, error: projectsError } = await supabaseClient
//       .from("projects")
//       .select("*")
//       .eq("autopilot_enabled", true);

//     if (projectsError) {
//       throw new Error(`Failed to fetch projects: ${projectsError.message}`);
//     }

//     if (!projects || projects.length === 0) {
//       console.log("No projects with autopilot enabled");
//       return new Response(
//         JSON.stringify({
//           success: true,
//           message: "No projects with autopilot enabled",
//           processed: 0,
//         }),
//         {
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     console.log(`Found ${projects.length} projects with autopilot enabled`);

//     const results = [];

//     for (const project of projects) {
//       // Check if WordPress is configured
//       if (!project.wp_url || !project.wp_username || !project.wp_app_password) {
//         console.log(`Skipping project ${project.id}: WordPress not configured`);
//         results.push({
//           projectId: project.id,
//           status: "skipped",
//           reason: "WordPress not configured",
//         });
//         continue;
//       }

//       // Get one generated (unpublished) brief for this project
//       const { data: briefs, error: briefsError } = await supabaseClient
//         .from("content_briefs")
//         .select("*")
//         .eq("project_id", project.id)
//         .eq("status", "generated")
//         .limit(1);

//       if (briefsError) {
//         console.error(
//           `Error fetching briefs for project ${project.id}:`,
//           briefsError
//         );
//         results.push({
//           projectId: project.id,
//           status: "error",
//           reason: briefsError.message,
//         });
//         continue;
//       }

//       if (!briefs || briefs.length === 0) {
//         console.log(`No unpublished briefs for project ${project.id}`);
//         results.push({
//           projectId: project.id,
//           status: "skipped",
//           reason: "No unpublished briefs",
//         });
//         continue;
//       }

//       const brief = briefs[0];
//       console.log(
//         `Publishing brief "${brief.title}" for project ${project.id}`
//       );

//       try {
//         // Parse content for WordPress
//         let content = brief.content;
//         let metaDescription = brief.meta_description;

//         if (typeof content === "string") {
//           try {
//             const parsed = JSON.parse(content);
//             if (parsed.outline) {
//               content = parsed.outline
//                 .map((section: any) => {
//                   const tag = section.type || "h2";
//                   return `<${tag}>${section.heading}</${tag}>\n<p>${
//                     section.notes || ""
//                   }</p>`;
//                 })
//                 .join("\n");
//             }
//             if (parsed.metaDescription) {
//               metaDescription = parsed.metaDescription;
//             }
//           } catch (e) {
//             // Use content as is
//           }
//         }

//         // Publish to WordPress as draft
//         const wpAuth = btoa(
//           `${project.wp_username}:${project.wp_app_password}`
//         );
//         const wpApiUrl = `${project.wp_url.replace(
//           /\/$/,
//           ""
//         )}/wp-json/wp/v2/posts`;

//         const wpResponse = await fetch(wpApiUrl, {
//           method: "POST",
//           headers: {
//             Authorization: `Basic ${wpAuth}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             title: brief.title,
//             content: content || "",
//             status: "draft",
//             excerpt: metaDescription || "",
//           }),
//         });

//         if (!wpResponse.ok) {
//           const errorText = await wpResponse.text();
//           throw new Error(
//             `WordPress API error: ${wpResponse.status} - ${errorText}`
//           );
//         }

//         const wpPost = await wpResponse.json();
//         console.log(`WordPress draft created: ${wpPost.id}`);

//         // Update brief status
//         await supabaseClient
//           .from("content_briefs")
//           .update({
//             status: "published",
//             published_at: new Date().toISOString(),
//           })
//           .eq("id", brief.id);

//         results.push({
//           projectId: project.id,
//           briefId: brief.id,
//           status: "published",
//           wpPostId: wpPost.id,
//           wpPostUrl: wpPost.link,
//         });
//       } catch (publishError) {
//         console.error(`Error publishing brief ${brief.id}:`, publishError);
//         results.push({
//           projectId: project.id,
//           briefId: brief.id,
//           status: "error",
//           reason:
//             publishError instanceof Error
//               ? publishError.message
//               : "Unknown error",
//         });
//       }
//     }

//     console.log("Autopilot job completed:", results);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         processed: results.length,
//         results,
//       }),
//       {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("Error in autopilot function:", error);
//     return new Response(
//       JSON.stringify({
//         error: error instanceof Error ? error.message : "Unknown error",
//         success: false,
//       }),
//       {
//         status: 500,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   }
// });





import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("🚀 Autopilot cycle started");

  // 1️⃣ Fetch autopilot-enabled projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, user_id, paused, daily_publish_limit")
    .eq("autopilot_enabled", true)
    .eq("paused", false);

  for (const project of projects ?? []) {
    // 2️⃣ Check daily publish limit
    const today = new Date().toISOString().slice(0, 10);

    const { count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("actor_id", project.user_id)
      .eq("action", "USER_PUBLISH")
      .gte("created_at", today);

    if ((count ?? 0) >= project.daily_publish_limit) {
      console.log(`⏭️ Daily limit reached for project ${project.id}`);
      continue;
    }

    // 3️⃣ Find generated briefs
    const { data: briefs } = await supabase
      .from("content_briefs")
      .select("id")
      .eq("project_id", project.id)
      .eq("status", "generated")
      .limit(1);

    if (!briefs?.length) {
      console.log(`📭 No briefs ready for ${project.id}`);
      continue;
    }

    // 4️⃣ Queue publish job
    await supabase.from("job_logs").insert({
      job_type: "publish",
      payload: {
        briefId: briefs[0].id,
        projectId: project.id,
        userId: project.user_id,
      },
      status: "pending",
    });

    console.log(`📦 Queued publish for project ${project.id}`);
  }

  return new Response("✅ Autopilot jobs queued");
});
