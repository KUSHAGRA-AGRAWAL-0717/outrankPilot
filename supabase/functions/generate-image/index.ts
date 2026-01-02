import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enqueue } from "../_lib/queue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, keywordId, projectId, userId } = await req.json();

    if (!keyword || !projectId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔑 SERVICE ROLE CLIENT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔒 Subscription check (SERVER SIDE)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (!sub || sub.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Subscription inactive" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 🚀 Enqueue brief generation
    await enqueue("generate-brief", {
      keyword,
      keywordId,
      projectId,
      userId,
    });

    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "GENERATE_BRIEF",
      target_id: projectId,
    });

    return new Response(
      JSON.stringify({ success: true, queued: true }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("generate-brief error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
