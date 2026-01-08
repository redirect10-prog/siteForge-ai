import { MessageSquare, Wand2, Rocket, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe Your Vision",
    description: "Tell us about your business, target audience, and goals. Our AI understands context and industry-specific needs.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI Creates Your Site",
    description: "In seconds, our AI generates a complete website with compelling copy, optimized structure, and conversion-focused design.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Launch & Grow",
    description: "Review, customize, and publish instantly. Your professional website is ready to attract customers and drive results.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent mb-6">
            Simple Process
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            From idea to launch in <span className="gradient-text">three steps</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            No design skills needed. No coding required. Just describe what you want and let AI handle the rest.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative group animate-fade-in opacity-0"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="glass-card p-8 h-full transition-all duration-300 hover:border-primary/30 hover:-translate-y-1">
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl font-bold text-muted/30">{step.number}</span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>

                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
