import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

async function generateImageWithHuggingFace(prompt: string): Promise<string> {
  const HF_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");

  if (!HF_API_KEY) {
    console.warn("Hugging Face API key not set, using placeholder");
    return `https://placehold.co/1200x675/1B64F2/white?text=${encodeURIComponent(
      prompt.substring(0, 30)
    )}`;
  }

  try {
    // Use Stable Diffusion XL instead - more reliable
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HF API error: ${response.status} - ${errorText}`);
      throw new Error(`HF API error: ${response.status}`);
    }

    // Check if response is actually an image
    const contentType = response.headers.get("content-type");
    console.log("HF Response content-type:", contentType);

    if (!contentType?.includes("image")) {
      const text = await response.text();
      console.error("HF returned non-image response:", text.substring(0, 200));
      throw new Error("HF did not return an image");
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Hugging Face generation error:", error);
    // Fallback to placeholder
    return `https://placehold.co/1200x675/1B64F2/white?text=${encodeURIComponent(
      prompt.substring(0, 30)
    )}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ✅ FIX: Parse payload once and store it
  let payload: any;
  let keywordId: string | null = null;

  try {
    payload = await req.json();
    console.log("generate-brief payload:", JSON.stringify(payload));

    const keyword = payload.keyword;
    keywordId = payload.keyword_id;
    const projectId = payload.project_id;
    const userId = payload.user_id;

    if (!keyword || !keywordId || !projectId || !userId) {
      console.error("Missing fields. Payload:", JSON.stringify(payload));
      return new Response(
        JSON.stringify({ error: "Missing required fields", received: payload }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check subscription status
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, ai_images")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub || sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription inactive" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const includeImages = sub.ai_images || false;
    console.log("AI Images enabled:", includeImages);

    // Generate content brief with AI
    const systemPrompt = includeImages
      ? `Generate a comprehensive SEO blog post for the keyword: "${keyword}".

Requirements:
- Full article content (1500+ words) in clean HTML format
- Use proper heading structure: <h2>, <h3>, <p> tags
- Include 3-5 image placement markers: [IMAGE: detailed description for image generation]
- Place images strategically between sections
- Make content SEO-optimized and engaging
- Include introduction, main body with subheadings, and conclusion

Respond ONLY with valid JSON in this exact format:
{
  "title": "SEO-optimized article title (60 chars max)",
  "meta_description": "Compelling meta description (150-160 chars)",
  "content": "<h2>Introduction</h2><p>Content here...</p>[IMAGE: description]<h2>Section 1</h2><p>More content...</p>",
  "word_count": 1500,
  "image_prompts": [
    "photorealistic ${keyword} concept",
    "professional ${keyword} illustration",
    "high-quality ${keyword} diagram"
  ],
  "outline": {
    "introduction": "Brief intro about ${keyword}",
    "main_sections": ["Section 1", "Section 2", "Section 3"],
    "conclusion": "Summary and call to action"
  }
}`
      : `Generate a comprehensive SEO blog post for the keyword: "${keyword}".

Requirements:
- Full article content (1500+ words) in clean HTML format
- Use proper heading structure: <h2>, <h3>, <p> tags
- Make content SEO-optimized and engaging
- Include introduction, main body with subheadings, and conclusion

Respond ONLY with valid JSON in this exact format:
{
  "title": "SEO-optimized article title (60 chars max)",
  "meta_description": "Compelling meta description (150-160 chars)",
  "content": "<h2>Introduction</h2><p>Content here...</p><h2>Section 1</h2><p>More content...</p>",
  "word_count": 1500,
  "outline": {
    "introduction": "Brief intro about ${keyword}",
    "main_sections": ["Section 1", "Section 2", "Section 3"],
    "conclusion": "Summary and call to action"
  }
}`;

    // ✅ FIX: Add retry logic for OpenAI API
    console.log("Calling OpenAI API...");
    let openaiResp;
    let retries = 3;

    while (retries > 0) {
      try {
        openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (openaiResp.ok) {
          break; // Success, exit retry loop
        }

        // If 502/503, retry
        if (openaiResp.status === 502 || openaiResp.status === 503) {
          retries--;
          if (retries > 0) {
            console.log(
              `OpenAI error ${openaiResp.status}, retrying... (${retries} left)`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
            continue;
          }
        }

        // Other errors, throw immediately
        const errorText = await openaiResp.text();
        throw new Error(`OpenAI error: ${openaiResp.status} - ${errorText}`);
      } catch (fetchError) {
        retries--;
        if (retries === 0) throw fetchError;
        console.log(`OpenAI fetch error, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (!openaiResp || !openaiResp.ok) {
      throw new Error("OpenAI API failed after retries");
    }

    const aiJson = await openaiResp.json();
    console.log("OpenAI response received");

    // Parse AI response
    let parsedBrief: any = {
      title: `${keyword} - Complete Guide`,
      meta_description: `Comprehensive guide about ${keyword}`,
      word_count: 1500,
      content: "<p>Content generation in progress...</p>",
      image_prompts: [],
    };

    const content = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = content
      .replace(/^```json\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .replace(/^```\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    try {
      parsedBrief = JSON.parse(cleaned);
      console.log("Parsed brief successfully. Title:", parsedBrief.title);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Cleaned content:", cleaned.substring(0, 500));
    }

    // Insert content brief
    console.log("Inserting brief into database...");
    const { data: briefData, error: insertError } = await supabase
      .from("content_briefs")
      .insert({
        title: parsedBrief.title,
        project_id: projectId,
        user_id: userId,
        keyword_id: keywordId,
        content: parsedBrief.content,
        word_count: parsedBrief.word_count || 1500,
        outline: parsedBrief.outline
          ? JSON.stringify(parsedBrief.outline)
          : null,
        meta_description: parsedBrief.meta_description || null,
        status: "generated",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log("Brief inserted with ID:", briefData.id);

    let finalContent = parsedBrief.content;
    let imagesGeneratedCount = 0;

    // Generate images if enabled
    if (
      includeImages &&
      parsedBrief.image_prompts &&
      parsedBrief.image_prompts.length > 0
    ) {
      console.log("Generating images for brief:", briefData.id);

      const imagePrompts = parsedBrief.image_prompts.slice(0, 5);
      const imageUrls: string[] = [];

      for (let i = 0; i < imagePrompts.length; i++) {
        try {
          const prompt = imagePrompts[i];
          console.log(
            `Generating image ${i + 1}/${
              imagePrompts.length
            }: ${prompt.substring(0, 50)}...`
          );

          const imageUrl = await generateImageWithHuggingFace(prompt);
          imageUrls.push(imageUrl);

          // Store in content_assets
          const { error: assetError } = await supabase
            .from("content_assets")
            .insert({
              id: crypto.randomUUID(),
              project_id: projectId,
              brief_id: briefData.id,
              type: "image",
              url: imageUrl,
              alt_text: prompt,
              position: i,
            });

          if (assetError) {
            console.error(`Error storing image ${i}:`, assetError);
          } else {
            console.log(`Image ${i + 1} stored successfully`);
          }
        } catch (imgError) {
          console.error(`Error generating image ${i}:`, imgError);
        }
      }

      console.log(`Total images generated: ${imageUrls.length}`);
      imagesGeneratedCount = imageUrls.length;

      // Replace [IMAGE: ...] markers with actual <img> tags
      if (imageUrls.length > 0) {
        imageUrls.forEach((url, index) => {
          const altText = imagePrompts[index];
          const imgTag = `\n<figure style="margin: 2em 0; text-align: center;">
  <img src="${url}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px;" loading="lazy" />
  <figcaption style="margin-top: 0.5em; font-size: 0.9em; color: #666;">${altText}</figcaption>
</figure>\n`;

          finalContent = finalContent.replace(/\[IMAGE:[^\]]*\]/, imgTag);
        });

        // Update brief with final content including images
        console.log("Updating brief with final content including images...");
        const { error: updateError } = await supabase
          .from("content_briefs")
          .update({ content: finalContent })
          .eq("id", briefData.id);

        if (updateError) {
          console.error("Error updating brief with images:", updateError);
        } else {
          console.log("Brief updated with images successfully");
        }
      }
    }

    // Update keyword status to 'generated'
    console.log("Updating keyword status...");
    await supabase
      .from("keywords")
      .update({ status: "generated" })
      .eq("id", keywordId);

    console.log("Brief generation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        brief: parsedBrief.title,
        brief_id: briefData.id,
        images_generated: imagesGeneratedCount,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("generate-brief error:", err);

    // ✅ FIX: Revert keyword status without re-parsing body
    if (keywordId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("keywords")
          .update({ status: "ready" })
          .eq("id", keywordId);
        console.log("Reverted keyword status to ready");
      } catch (revertError) {
        console.error("Error reverting keyword status:", revertError);
      }
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
