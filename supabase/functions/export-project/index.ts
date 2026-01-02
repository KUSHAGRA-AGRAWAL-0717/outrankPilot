import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing auth", { status: 401, headers: corsHeaders });
    }

    // Client for auth (uses user JWT)
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const jwt = authHeader.replace('Bearer ', '');
const {
  data: { user },
} = await supabaseAuth.auth.getUser(jwt);

if (!user) {
  return new Response("Unauthorized", {
    status: 401,
    headers: corsHeaders,
  });
}

   

    // Service role client (DB access)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { project_id, format } = await req.json();

    // 🔒 Ownership check
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return new Response("Forbidden", {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Fetch data
    const [keywords, briefs] = await Promise.all([
      supabase.from("keywords").select("*").eq("project_id", project_id),
      supabase.from("content_briefs").select("*").eq("project_id", project_id),
    ]);

    const exportData = {
      project_id,
      keywords: keywords.data ?? [],
      content_briefs: briefs.data ?? [],
      exported_at: new Date().toISOString(),
    };

    // Markdown export
    if (format === "markdown") {
      let md = `# Project Export\n\n`;

      md += `## Keywords\n`;
      exportData.keywords.forEach((k: any) => {
        md += `- **${k.keyword}** (vol: ${k.volume}, diff: ${k.difficulty})\n`;
      });

      md += `\n## Content Briefs\n`;
      exportData.content_briefs.forEach((b: any) => {
        md += `\n### ${b.title}\n${b.content || ""}\n`;
      });

      return new Response(md, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/markdown",
        },
      });
    }

    // CSV export
if (format === "csv") {
  const rows: string[] = [];
  rows.push(
    "keyword,volume,difficulty,content_title,content_status,word_count,published_at"
  );

  exportData.keywords.forEach((k: any) => {
    const brief = exportData.content_briefs.find(
      (b: any) => b.keyword_id === k.id
    );

    rows.push(
      [
        `"${k.keyword}"`,
        k.volume,
        k.difficulty,
        `"${brief?.title ?? ""}"`,
        brief?.status ?? "",
        brief?.word_count ?? 0,
        brief?.published_at ?? "",
      ].join(",")
    );
  });

  return new Response(rows.join("\n"), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=project-export.csv",
    },
  });
}


    // Default JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
