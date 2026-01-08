import { Layers, Zap, Target, Globe, Palette, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Get complete website content in under 30 seconds. No waiting, no drafts."
  },
  {
    icon: Target,
    title: "Conversion-Focused",
    description: "Every word is optimized to drive action and convert visitors into customers."
  },
  {
    icon: Layers,
    title: "Multiple Formats",
    description: "Landing pages, business sites, portfolios, blogs, e-commerce – we cover it all."
  },
  {
    icon: Globe,
    title: "SEO-Ready",
    description: "Content structured for search engines without sacrificing readability."
  },
  {
    icon: Palette,
    title: "Brand-Aligned",
    description: "Tone and style that matches your brand personality and audience."
  },
  {
    icon: Shield,
    title: "Professional Quality",
    description: "Human-level copywriting that sounds authentic, not robotic."
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Why teams choose <span className="gradient-text">SiteForge</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Built for speed, optimized for results. Everything you need to launch faster.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass-card glow-effect p-6 transition-all duration-300 hover:border-primary/30 animate-fade-in opacity-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
