import { useState, useEffect } from "react";
import { Send, Loader2, Sparkles, Globe, ShoppingBag, Briefcase, User, BookOpen, Image, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ColorPicker, ColorScheme } from "@/components/ColorPicker";

interface GeneratorInterfaceProps {
  tier: 'free' | 'pro' | 'business';
  requestsUsed: number;
  requestsLimit: number;
  onGenerate: (prompt: string, withImages: boolean, colorScheme?: ColorScheme | null) => void;
  isGenerating: boolean;
  initialPrompt?: string;
}

const websiteTypes = [
  { icon: Globe, label: "Landing Page", prompt: "Create a landing page for" },
  { icon: Briefcase, label: "Business", prompt: "Create a business website for" },
  { icon: ShoppingBag, label: "E-commerce", prompt: "Create an e-commerce store for" },
  { icon: User, label: "Portfolio", prompt: "Create a portfolio website for" },
  { icon: BookOpen, label: "Blog", prompt: "Create a blog website about" },
];

export function GeneratorInterface({ 
  tier, 
  requestsUsed, 
  requestsLimit, 
  onGenerate, 
  isGenerating,
  initialPrompt = ""
}: GeneratorInterfaceProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generateImages, setGenerateImages] = useState(true);
  const [selectedColor, setSelectedColor] = useState<ColorScheme | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLimitReached = requestsUsed >= requestsLimit;

  // Update prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (prompt.trim() && !isLimitReached && !isGenerating) {
      onGenerate(prompt, generateImages, selectedColor);
    }
  };

  const handleQuickStart = (basePrompt: string) => {
    setPrompt(basePrompt + " ");
  };

  return (
    <section id="generator" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Section header */}
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Describe your <span className="gradient-text">vision</span>
            </h2>
            <p className="text-muted-foreground">
              Tell us about your business, product, or idea. We'll generate complete website content.
            </p>
          </div>

          {/* Quick start chips */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {websiteTypes.map((type) => (
              <button
                key={type.label}
                onClick={() => handleQuickStart(type.prompt)}
                className="group flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm transition-all hover:border-primary/50 hover:bg-secondary"
              >
                <type.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Generator form */}
          <form onSubmit={handleSubmit} className="glass-card p-6">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A SaaS product that helps small businesses manage their inventory with AI-powered predictions..."
                className="min-h-[140px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLimitReached || isGenerating}
              />
            </div>

            <div className="mt-4 flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  disabled={isGenerating}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="generate-images"
                    checked={generateImages}
                    onCheckedChange={setGenerateImages}
                    disabled={isGenerating}
                  />
                  <Label 
                    htmlFor="generate-images" 
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Image className="h-4 w-4" />
                    <span>Images</span>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="gradient" 
                disabled={!prompt.trim() || isLimitReached || isGenerating}
                className="relative z-10"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : !user ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Sign in to Generate
                    </>
                  ) : (
                    <>
                      Generate
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>

          {/* Limit reached message */}
          {isLimitReached && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">
                Daily limit reached. Upgrade your plan to generate more websites and unlock advanced layouts.
              </p>
              <Button variant="gradient" size="sm" className="mt-3 relative z-10">
                <span className="relative z-10">Upgrade Now</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
