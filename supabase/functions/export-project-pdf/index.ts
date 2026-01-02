import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { project_id } = await req.json();

  const { data: keywords } = await supabase
    .from("keywords")
    .select("*")
    .eq("project_id", project_id);

  const html = `
    <html>
      <body>
        <h1>Project Report</h1>
        <table border="1">
          <tr>
            <th>Keyword</th><th>Volume</th><th>Difficulty</th>
          </tr>
          ${keywords
            ?.map(
              (k) =>
                `<tr><td>${k.keyword}</td><td>${k.volume}</td><td>${k.difficulty}</td></tr>`
            )
            .join("")}
        </table>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
});
