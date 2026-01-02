import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",  // ✅ Add x-client-info
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefId, projectId } = await req.json();
    if (!briefId || !projectId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // fetch project & brief
    const { data: project } = await supabase.from("projects").select("id, user_id, autopilot_enabled, paused, daily_publish_limit, wp_url, wp_username, wp_app_password").eq("id", projectId).maybeSingle();
    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: corsHeaders });

    const { data: brief } = await supabase.from("content_briefs").select("*").eq("id", briefId).maybeSingle();
    if (!brief) return new Response(JSON.stringify({ error: "Brief not found" }), { status: 404, headers: corsHeaders });

    // subscription check
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", project.user_id).maybeSingle();
    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription inactive" }), { status: 403, headers: corsHeaders });
    }
    if (!sub.auto_publish || !project.autopilot_enabled) {
      return new Response(JSON.stringify({ error: "Auto publish not allowed" }), { status: 403, headers: corsHeaders });
    }
    if (project.paused) {
      return new Response(JSON.stringify({ error: "Project paused" }), { status: 403, headers: corsHeaders });
    }

    // daily limit check
    const today = new Date().toISOString().slice(0, 10);
    const { count: publishedToday } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("actor_id", project.user_id)
      .eq("action", "USER_PUBLISH")
      .gte("created_at", today);

    if ((publishedToday ?? 0) >= (project.daily_publish_limit ?? 3)) {
      return new Response(JSON.stringify({ error: "Daily limit reached" }), { status: 403, headers: corsHeaders });
    }

    // WordPress publish
    const authBasic = btoa(`${project.wp_username}:${project.wp_app_password}`);
    const res = await fetch(`${project.wp_url.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { Authorization: `Basic ${authBasic}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: brief.title,
        content: brief.content,
        status: "draft",
      }),
    });

    const wpPost = await res.json();
    if (!wpPost?.id) {
      console.error("WP publish error:", wpPost);
      return new Response(JSON.stringify({ error: "WordPress publish failed", details: wpPost }), { status: 500, headers: corsHeaders });
    }

    // update brief + logs
    await supabase.from("content_briefs").update({
      status: "published",
      wp_post_id: wpPost.id,
      wp_post_url: wpPost.link ?? null,
      published_at: new Date(),
    }).eq("id", briefId);

    await supabase.from("audit_logs").insert({ actor_id: project.user_id, action: "USER_PUBLISH", target_id: projectId });

    return new Response(JSON.stringify({ success: true, postId: wpPost.id }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("publish error:", err);
    return new Response(JSON.stringify({ error: err.message || "Publish failed" }), { status: 500, headers: corsHeaders });
  }
});
