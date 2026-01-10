import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { domain } = await req.json();

  // Simple domain analysis (expand with real APIs)
  try {
    // Fetch Open Graph / meta tags
    const html = await fetch(`https://${domain}`).then((r) => r.text());

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
    const langMatch = html.match(/<html[^>]*lang="([^"]+)"/i);

    return new Response(
      JSON.stringify({
        business_name: titleMatch?.[1] || domain,
        description: descMatch?.[1] || "",
        language: langMatch?.[1]?.split("-")[0] || "en",
        country: "US",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        business_name: domain,
        description: "",
        language: "en",
        country: "US",
      })
    );
  }
});
