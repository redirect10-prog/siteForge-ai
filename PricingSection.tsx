import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out the platform",
    price: "Free",
    priceDetail: "Forever free",
    features: [
      "3 website generations",
      "3 edits per website",
      "Basic templates",
      "Community support",
      "Export to HTML",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    description: "For creators and growing businesses",
    price: "$20",
    priceDetail: "per month",
    features: [
      "Unlimited website generations",
      "Unlimited edits",
      "Premium templates",
      "Priority support",
      "Custom branding",
      "AI image generation",
      "Backend code generation",
    ],
    cta: "Upgrade to Pro",
    variant: "gradient" as const,
    popular: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-0 h-[400px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-1/3 right-0 h-[400px] w-[600px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary mb-6">
            Simple Pricing
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Plans that <span className="gradient-text">scale with you</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Start free, upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative glass-card p-8 flex flex-col animate-fade-in opacity-0 ${
                plan.popular ? 'border-primary/50 scale-105 lg:scale-110' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-sm font-medium text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Free" && plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/{plan.priceDetail.replace('per ', '')}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.priceDetail}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant={plan.variant} size="lg" className="w-full">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All paid plans include a 14-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
}
