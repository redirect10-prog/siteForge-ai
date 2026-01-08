import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, images_used, images_limit')
    .eq('user_id', userId)
    .maybeSingle();

  return { 
    user: { id: userId }, 
    subscription,
    supabase 
  };
}

async function pollForResult(getUrl: string, token: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(getUrl, {
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Poll attempt ${i + 1}: status = ${result.status}`);

    if (result.status === "succeeded") {
      return result;
    } else if (result.status === "failed" || result.status === "canceled") {
      throw new Error(`Prediction ${result.status}: ${result.error || "Unknown error"}`);
    }

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Prediction timed out");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication for image generation (expensive operation)
    const { user, subscription, supabase } = await validateAndGetUser(req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required for image generation" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check image rate limits
    if (subscription) {
      if (subscription.images_used >= subscription.images_limit) {
        return new Response(
          JSON.stringify({ 
            error: "Image generation limit reached. Upgrade your plan for more images.",
            imagesUsed: subscription.images_used,
            imagesLimit: subscription.images_limit,
            tier: subscription.tier
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Increment image usage
      const { error: updateError } = await supabase!
        .from('user_subscriptions')
        .update({ 
          images_used: subscription.images_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error("Failed to update image usage:", updateError);
      }
    }

    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    if (!REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not configured");
      throw new Error("API key not configured");
    }

    console.log(`Generating image for user ${user.id}: ${prompt.substring(0, 100)}...`);

    // Create prediction using Stable Diffusion XL
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        input: {
          prompt: `${prompt}. High quality, professional, modern website imagery, clean aesthetics.`,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    console.log("Prediction created:", prediction.id);

    // Poll for result
    const result = await pollForResult(prediction.urls.get, REPLICATE_API_TOKEN);
    
    const imageUrl = result.output?.[0];
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(result, null, 2));
      throw new Error("No image generated");
    }

    console.log("Image generated successfully");

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-image function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});