import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import FreeTierBadge from "@/components/FreeTierBadge";

interface WebsiteData {
  id: string;
  slug: string;
  prompt: string;
  website_type: string;
  target_audience: string;
  tier: string | null;
  sections: {
    name: string;
    heading: string;
    content: string;
    cta?: string;
    imagePrompt?: string;
    generatedImage?: string;
  }[];
  created_at: string;
}

export default function SharedWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsite() {
      if (!slug) {
        setError("No website found");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("generated_websites")
        .select("*")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        console.error("Error fetching website:", fetchError);
        setError("Website not found");
      } else {
        const sections = Array.isArray(data.sections) 
          ? data.sections as WebsiteData['sections']
          : [];
        setWebsite({
          ...data,
          sections,
          website_type: data.website_type || "Website",
          target_audience: data.target_audience || "",
        });
      }
      setLoading(false);
    }

    fetchWebsite();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading website...</span>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Website Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The website you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button variant="gradient" className="relative z-10">
              <span className="relative z-10 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Generator
              </span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Website content */}
      <main>
        {website.sections.map((section, index) => (
          <section
            key={section.name}
            className={`py-20 ${index % 2 === 0 ? "bg-background" : "bg-secondary/30"}`}
          >
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
                  {section.name}
                </div>
                
                {/* Section image */}
                {section.generatedImage && (
                  <div className="mb-8 rounded-lg overflow-hidden">
                    <img 
                      src={section.generatedImage} 
                      alt={`${section.name} visual`}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                
                <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                  {section.heading}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
                {section.cta && (
                  <div className="mt-8">
                    <Button variant="gradient" size="lg" className="relative z-10">
                      <span className="relative z-10">{section.cta}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            This website was generated with{" "}
            <Link to="/" className="text-primary hover:underline">
              SiteForge AI
            </Link>
          </p>
        </div>
      </footer>

      {/* Free Tier Badge */}
      {(!website.tier || website.tier === "free") && <FreeTierBadge />}
    </div>
  );
}
