import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const { keyword, content } = await req.json();
    const API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    
    if (!API_KEY) {
      return new Response("Missing YOUTUBE_API_KEY", { status: 500 });
    }
    if (!keyword || !content) {
      return new Response("Missing keyword or content", { status: 400 });
    }

    // Better search query with relevance
    const searchQuery = `${keyword} tutorial explainer`;
    
    const yt = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        q: searchQuery,
        key: API_KEY,
        part: "snippet",
        type: "video",
        maxResults: 3,
        order: "relevance",
        videoDuration: "medium" // 4-20 min videos
      })
    ).then((r) => r.json());

    if (yt.error) {
      return new Response(`YouTube API Error: ${yt.error.message}`, { status: 500 });
    }

    if (!yt.items?.[0]?.id?.videoId) {
      return new Response("No relevant video found", { status: 404 });
    }

    const videoId = yt.items[0].id.videoId;
    const videoTitle = yt.items[0].snippet.title;
    
    // Responsive iframe with better styling
    const iframe = `
      <div class="youtube-container">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0" 
          frameborder="0" 
          allowfullscreen 
          class="youtube-iframe"
          title="${videoTitle}"
        ></iframe>
      </div>
    `;
    
    const newContent = content.replace("</h2>", `</h2>\n\n${iframe}`);

    return new Response(
      JSON.stringify({ 
        content: newContent, 
        videoId,
        videoTitle 
      }), 
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
});
