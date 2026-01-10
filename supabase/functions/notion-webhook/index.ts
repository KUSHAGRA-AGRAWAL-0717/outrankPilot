import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const payload = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  // Verify webhook (Notion sends page updates)
  if (payload.eventTime) {
    const { data: brief } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("notion_page_id", payload.page.id)
      .single();

    // Update status based on Notion properties
    await supabase
      .from("content_briefs")
      .update({
        publish_status:
          payload.property_values?.Status?.[0]?.select?.name || "updated",
        updated_at: new Date(),
      })
      .eq("id", brief.id);

    // Log webhook
    await supabase.from("publish_webhooks").insert({
      content_brief_id: brief.id,
      platform: "notion",
      status: "received",
      payload: payload,
    });
  }

  return new Response("OK", { status: 200 });
});
