import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

async function generateImageWithPicsum(prompt: string, index: number): Promise<string> {
  try {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = ((hash << 5) - hash) + prompt.charCodeAt(i);
      hash = hash & hash;
    }
    
    const imageId = Math.abs(hash % 1000) + 1 + (index * 17);
    const imageUrl = `https://picsum.photos/id/${imageId}/1200/675`;
    
    console.log(`Generated Picsum URL: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error("Picsum image generation error:", error);
    return `https://picsum.photos/1200/675?random=${index}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    // ✅ FIX: Check subscription and allow both 'active' and 'trialing' statuses
    console.log(`Checking subscription for user: ${userId}`);
    
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("status, ai_images, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("Subscription data:", JSON.stringify(sub));

    if (subError) {
      console.error("Subscription query error:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to check subscription", details: subError.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    if (!sub) {
      console.warn("No subscription found for user");
      return new Response(
        JSON.stringify({ 
          error: "No subscription found", 
          message: "Please subscribe to a plan to generate content briefs"
        }), 
        { status: 403, headers: corsHeaders }
      );
    }

    // ✅ FIX: Allow both 'active' and 'trialing' statuses
    const validStatuses = ['active', 'trialing'];
    if (!validStatuses.includes(sub.status)) {
      console.error(`Subscription status is '${sub.status}', expected 'active' or 'trialing'`);
      return new Response(
        JSON.stringify({ 
          error: "Subscription inactive", 
          status: sub.status,
          message: "Please activate your subscription to generate content briefs"
        }), 
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if trial has ended
    if (sub.status === 'trialing' && sub.trial_ends_at) {
      const trialEnd = new Date(sub.trial_ends_at);
      const now = new Date();
      if (now > trialEnd) {
        console.error(`Trial ended at ${sub.trial_ends_at}`);
        return new Response(
          JSON.stringify({ 
            error: "Trial expired", 
            message: "Your trial has ended. Please upgrade to a paid plan to continue."
          }), 
          { status: 403, headers: corsHeaders }
        );
      }
    }

    const includeImages = sub.ai_images || false;
    console.log(`Subscription status: ${sub.status}, AI Images enabled: ${includeImages}`);

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
          break;
        }

        if (openaiResp.status === 502 || openaiResp.status === 503) {
          retries--;
          if (retries > 0) {
            console.log(
              `OpenAI error ${openaiResp.status}, retrying... (${retries} left)`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
        }

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
            `Generating image ${i + 1}/${imagePrompts.length}: ${prompt.substring(0, 50)}...`
          );

          const imageUrl = await generateImageWithPicsum(prompt, i);
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
