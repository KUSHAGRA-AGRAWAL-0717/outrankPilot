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

    // Parse webhook payload
    let payload;
    try {
      payload = await req.json();
    } catch {
      console.error("Invalid JSON payload");
      return new Response("Invalid payload", { status: 400 });
    }

    console.log("Notion webhook received:", JSON.stringify(payload, null, 2));

    // Notion sends different types of events
    // We're looking for page updates
    if (payload.type === "page" && payload.page?.id) {
      const pageId = payload.page.id;

      // Find the content brief with this Notion page ID
      const { data: brief, error: briefError } = await supabase
        .from("content_briefs")
        .select("*")
        .eq("notion_page_id", pageId)
        .maybeSingle();

      if (briefError) {
        console.error("Error finding brief:", briefError);
        return new Response("OK", { status: 200 }); // Return 200 to acknowledge webhook
      }

      if (!brief) {
        console.log(`No brief found for Notion page ${pageId}`);
        return new Response("OK", { status: 200 });
      }

      // Extract status from Notion properties if available
      let status = "updated";
      if (payload.page?.properties?.Status) {
        const statusProp = payload.page.properties.Status;
        if (statusProp.select?.name) {
          status = statusProp.select.name.toLowerCase();
        }
      }

      // Update the brief
      const { error: updateError } = await supabase
        .from("content_briefs")
        .update({
          publish_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", brief.id);

      if (updateError) {
        console.error("Error updating brief:", updateError);
      }

      console.log(`Updated brief ${brief.id} with status: ${status}`);
    }

    // Always return 200 to acknowledge the webhook
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    
    // Still return 200 to prevent Notion from retrying
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});