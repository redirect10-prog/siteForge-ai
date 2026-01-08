import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are SiteForge AI, an expert website content editor.

Your job is to edit existing website section content based on user instructions.

You will receive:
1. The current section content (name, heading, content, cta, imagePrompt)
2. Edit instructions from the user

You must return a JSON response with this exact structure:
{
  "name": "section name (keep same or improve)",
  "heading": "updated heading",
  "content": "updated content",
  "cta": "updated call-to-action (optional, can be null)",
  "imagePrompt": "updated image prompt if visual changes are requested, otherwise keep the same"
}

EDITING PRINCIPLES:
- Maintain brand voice consistency
- Keep the core message unless explicitly asked to change it
- Improve clarity and conversion potential
- Make specific, targeted edits as requested
- If asked to make it "shorter", actually make it shorter
- If asked to make it "more engaging", add power words and emotion
- If asked for a different tone, completely shift the voice

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanation text outside the JSON.`;

async function validateAndGetUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return { user: null };
  }

  return { user: { id: claimsData.claims.sub } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication for editing
    const { user } = await validateAndGetUser(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required for editing" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { section, editInstructions } = await req.json();
    
    if (!section || !editInstructions) {
      return new Response(
        JSON.stringify({ error: "Section and edit instructions are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("API key not configured");
    }

    console.log(`User ${user.id} editing section: ${section.name}, instructions: ${editInstructions.substring(0, 100)}...`);

    const userMessage = `Current section content:
- Name: ${section.name}
- Heading: ${section.heading}
- Content: ${section.content}
- CTA: ${section.cta || "None"}
- Image Prompt: ${section.imagePrompt || "None"}

Edit instructions: ${editInstructions}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean up the response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const editedSection = JSON.parse(cleanedContent);

    return new Response(
      JSON.stringify({ section: editedSection }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in edit-website function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to edit content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});