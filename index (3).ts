import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are SiteForge AI, a website content generator.

Generate COMPLETE website content as JSON. Return ONLY valid JSON with markdown, code blocks, explanations.

REQUIRED JSON SCHEMA:
{
  "websiteType": "saas" | "ecommerce" | "portfolio" | "agency" | "blog" | "landing",
  "targetAudience": "description of target users",
  "sections": [
    {
      "name": "Hero" | "Features" | "Pricing" | "Testimonials" | "CTA" | "About" | "Contact" | "FAQ",
      "heading": "compelling headline text",
      "content": "supporting paragraph text (2-4 sentences)",
      "cta": "button text" | null,
      "ctaAction": "scroll" | "link" | "modal" | "form" | null,
      "ctaTarget": "#section-id" | "https://url" | null,
      "imagePrompt": "detailed image description for AI generation",
      "hasForm": true | false,
      "formType": "contact" | "newsletter" | "signup" | null
    }
  ],
  "navigation": [
    {
      "label": "Menu Item Text",
      "target": "#section-id",
      "type": "scroll" | "link" | "button"
    }
  ],
  "suggestedPrompts": ["follow-up prompt 1", "follow-up prompt 2"],
  "internalExplanation": {
    "websiteType": "why this type was chosen",
    "audience": "target audience analysis",
    "sectionRationale": "why these sections were included",
    "copyStrategy": "approach to headlines and copy",
    "conversionGoal": "primary conversion objective",
    "tierImpact": "how tier affected generation"
  }
}

RULES:
1. Start response with { and end with }
2. Generate 3-6 sections based on tier
3. Every section MUST have: name, heading, content, imagePrompt
4. Headlines should be benefit-driven and compelling
5. Content should be realistic, not placeholder text
6. imagePrompt should describe professional website imagery
7. Include navigation items matching sections
8. Include 2-3 suggestedPrompts for follow-up modifications`;

const MAX_RETRIES = 3;

interface Section {
  name: string;
  heading: string;
  content: string;
  cta?: string | null;
  ctaAction?: string | null;
  ctaTarget?: string | null;
  imagePrompt?: string;
  hasForm?: boolean;
  formType?: string | null;
}

interface Navigation {
  label: string;
  target: string;
  type: string;
}

interface GeneratedWebsite {
  websiteType: string;
  targetAudience: string;
  sections: Section[];
  navigation: Navigation[];
  suggestedPrompts?: string[];
  internalExplanation: Record<string, string>;
}

interface GenerationResult {
  success: boolean;
  data?: GeneratedWebsite;
  error?: string;
}

async function validateAndGetUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, subscription: null, supabase: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return { user: null, subscription: null, supabase: null };
  }

  const userId = claimsData.claims.sub;

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, requests_used, requests_limit')
    .eq('user_id', userId)
    .maybeSingle();

  return { user: { id: userId }, subscription, supabase };
}

function normalizeSection(raw: any, index: number): Section {
  const name = raw?.name ?? raw?.title ?? `Section ${index + 1}`;
  return {
    name,
    heading: raw?.heading ?? raw?.title ?? name,
    content: typeof raw?.content === "string" ? raw.content : "",
    cta: raw?.cta ?? raw?.callToAction ?? null,
    ctaAction: raw?.ctaAction ?? null,
    ctaTarget: raw?.ctaTarget ?? null,
    imagePrompt: raw?.imagePrompt ?? `Professional website imagery for ${name} section`,
    hasForm: raw?.hasForm ?? (raw?.form ? true : false),
    formType: raw?.formType ?? null,
  };
}

function normalizeNavigation(raw: any): Navigation {
  return {
    label: raw?.label ?? raw?.title ?? "Link",
    target: raw?.target ?? raw?.link ?? raw?.href ?? "#",
    type: raw?.type ?? "scroll",
  };
}

function normalizeResponse(raw: any): GeneratedWebsite {
  const sections = Array.isArray(raw?.sections) 
    ? raw.sections.map((s: any, i: number) => normalizeSection(s, i))
    : [];

  const navigation = Array.isArray(raw?.navigation)
    ? raw.navigation.map((n: any) => normalizeNavigation(n))
    : sections.map((s: Section) => ({
        label: s.name,
        target: `#${s.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: "scroll" as const,
      }));

  const internalExplanation = typeof raw?.internalExplanation === "object" && raw.internalExplanation !== null
    ? raw.internalExplanation
    : {
        websiteType: String(raw?.websiteType ?? "landing"),
        audience: String(raw?.targetAudience ?? ""),
        sectionRationale: typeof raw?.internalExplanation === "string" ? raw.internalExplanation : "",
        copyStrategy: "",
        conversionGoal: "",
        tierImpact: "",
      };

  return {
    websiteType: String(raw?.websiteType ?? "landing"),
    targetAudience: String(raw?.targetAudience ?? ""),
    sections,
    navigation,
    suggestedPrompts: Array.isArray(raw?.suggestedPrompts) ? raw.suggestedPrompts : [],
    internalExplanation,
  };
}

async function attemptGeneration(
  apiKey: string,
  tierContext: string,
  colorContext: string,
  prompt: string
): Promise<GenerationResult> {
  const userPrompt = `${tierContext}
${colorContext}

User request: ${prompt}

Generate the complete website JSON now.`;

  const payload = {
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await groqRes.text();

  if (!groqRes.ok) {
    console.error("Groq API failed:", raw);
    return { success: false, error: "AI generation failed" };
  }

  try {
    const parsed = JSON.parse(raw);
    const content = parsed.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: "Empty response from AI" };
    }

    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    // Find the JSON object boundaries
    const startIdx = jsonContent.indexOf('{');
    const endIdx = jsonContent.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      console.error("No valid JSON object found:", jsonContent.substring(0, 200));
      return { success: false, error: "Response is not valid JSON object" };
    }

    jsonContent = jsonContent.substring(startIdx, endIdx + 1);

    const rawResult = JSON.parse(jsonContent);
    const normalized = normalizeResponse(rawResult);

    // Validate required fields
    if (normalized.sections.length === 0) {
      return { success: false, error: "No sections generated" };
    }

    // Validate each section has required fields
    for (const section of normalized.sections) {
      if (!section.name || !section.heading) {
        return { success: false, error: "Section missing required fields" };
      }
    }

    return { success: true, data: normalized };
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    return { success: false, error: "Failed to parse AI response as JSON" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tier: requestedTier = "free", colorScheme } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const { user, subscription, supabase } = await validateAndGetUser(req);
    
    let tier = "free";
    
    if (user && subscription) {
      if (subscription.requests_used >= subscription.requests_limit) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Upgrade your plan for more generations.",
            requestsUsed: subscription.requests_used,
            requestsLimit: subscription.requests_limit,
            tier: subscription.tier
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      tier = subscription.tier || "free";
      
      const { error: updateError } = await supabase!
        .from('user_subscriptions')
        .update({ 
          requests_used: subscription.requests_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error("Failed to update usage:", updateError);
      }
    } else {
      console.log("Anonymous generation request");
    }

    const tierContext =
      tier === "free"
        ? "Generate 3-4 sections for a basic landing page. Include Hero, Features, and CTA sections."
        : tier === "pro"
        ? "Generate 5-6 sections for a professional website. Include Hero, Features, Pricing, Testimonials, and CTA sections."
        : "Generate 6-7 sections for a premium enterprise website with full features.";

    const colorContext = colorScheme
      ? `Use this color scheme in your imagePrompts: Primary ${colorScheme.primary}, Secondary ${colorScheme.secondary}, Accent ${colorScheme.accent}.`
      : "";

    let lastError = "";
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`Generation attempt ${attempt}/${MAX_RETRIES}`);
      
      const result = await attemptGeneration(apiKey, tierContext, colorContext, prompt);
      
      if (result.success && result.data) {
        console.log(`Success on attempt ${attempt}, sections: ${result.data.sections.length}`);
        return new Response(
          JSON.stringify({ result: result.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      lastError = result.error || "Unknown error";
      console.error(`Attempt ${attempt} failed: ${lastError}`);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(
      JSON.stringify({ error: `Generation failed after ${MAX_RETRIES} attempts. ${lastError}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Generation error:", err);
    return new Response(
      JSON.stringify({ error: "Generation failed. Reduce prompt complexity or retry." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
