import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefId, projectId, publishStatus } = await req.json();
    if (!briefId || !projectId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch project & brief
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, wp_url, wp_username, wp_app_password")
      .eq("id", projectId)
      .maybeSingle();
    
    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: brief, error: briefError } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", briefId)
      .maybeSingle();
    
    if (briefError || !brief) {
      return new Response(JSON.stringify({ error: "Brief not found" }), { status: 404, headers: corsHeaders });
    }

    // Subscription check
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", project.user_id)
      .maybeSingle();
    
    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription inactive" }), { status: 403, headers: corsHeaders });
    }

    // Validate WordPress credentials
    if (!project.wp_url || !project.wp_username || !project.wp_app_password) {
      return new Response(
        JSON.stringify({ error: "WordPress credentials not configured" }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Get images for this brief
    const { data: images } = await supabase
      .from("content_assets")
      .select("*")
      .eq("brief_id", briefId)
      .eq("type", "image")
      .order("position", { ascending: true });

    let featuredImageId = null;

    // Upload first image as featured image to WordPress if available
    if (images && images.length > 0) {
      try {
        const firstImage = images[0];
        
        // Fetch image from Pollinations.ai
        const imageResponse = await fetch(firstImage.url);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          
          // Upload to WordPress Media Library
          const authBasic = btoa(`${project.wp_username}:${project.wp_app_password}`);
          const mediaResponse = await fetch(
            `${project.wp_url.replace(/\/$/, "")}/wp-json/wp/v2/media`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${authBasic}`,
                "Content-Disposition": `attachment; filename="featured-${briefId}.jpg"`,
                "Content-Type": "image/jpeg",
              },
              body: imageBuffer,
            }
          );

          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            featuredImageId = mediaData.id;
            console.log("Featured image uploaded:", featuredImageId);
          }
        }
      } catch (uploadError) {
        console.error("Failed to upload featured image:", uploadError);
        // Continue without featured image
      }
    }

    // WordPress publish
    const authBasic = btoa(`${project.wp_username}:${project.wp_app_password}`);
    
    const wpPayload: any = {
      title: brief.title,
      content: brief.content, // Already contains <img> tags with Pollinations URLs
      status: publishStatus || "draft",
      excerpt: brief.meta_description || "",
    };

    // Add featured image if uploaded
    if (featuredImageId) {
      wpPayload.featured_media = featuredImageId;
    }

    const res = await fetch(`${project.wp_url.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { 
        Authorization: `Basic ${authBasic}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(wpPayload),
    });

    const wpPost = await res.json();
    
    if (!res.ok || !wpPost?.id) {
      console.error("WP publish error:", wpPost);
      return new Response(
        JSON.stringify({ 
          error: "WordPress publish failed", 
          details: wpPost?.message || wpPost 
        }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Update brief status
    await supabase.from("content_briefs").update({
      status: "published",
      wp_post_id: wpPost.id,
      wp_post_url: wpPost.link ?? null,
      published_at: new Date().toISOString(),
    }).eq("id", briefId);

    console.log("Published successfully:", wpPost.link);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: wpPost.id,
        postUrl: wpPost.link,
        featuredImageId: featuredImageId
      }), 
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("publish error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Publish failed" }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
