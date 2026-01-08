import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 lg:pt-36 lg:pb-32">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 h-[400px] w-[500px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex animate-fade-in items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground/80">Trusted by 50,000+ businesses worldwide</span>
          </div>

          {/* Headline */}
          <h1 className="mb-8 text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in [animation-delay:100ms] opacity-0">
            Transform ideas into
            <br />
            <span className="gradient-text">stunning websites</span>
            <br />
            in seconds
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground text-balance animate-fade-in [animation-delay:200ms] opacity-0 sm:text-xl leading-relaxed">
            SiteForge uses advanced AI to generate complete, conversion-optimized 
            websites tailored to your brand. No coding required. Launch faster than ever.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in [animation-delay:300ms] opacity-0">
            <Button 
              variant="gradient" 
              size="xl" 
              onClick={onGetStarted}
              className="group min-w-[200px]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
            <Button variant="glass" size="xl" className="min-w-[200px]">
              <Play className="h-4 w-4 mr-1" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 animate-fade-in [animation-delay:400ms] opacity-0">
            <p className="text-sm text-muted-foreground mb-6">Powering websites for leading companies</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma'].map((brand) => (
                <span key={brand} className="text-lg font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4 animate-fade-in [animation-delay:500ms] opacity-0">
            {[
              { value: '50K+', label: 'Websites Created' },
              { value: '<30s', label: 'Generation Time' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '4.9/5', label: 'Customer Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
