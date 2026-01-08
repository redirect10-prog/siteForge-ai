import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, TechFlow",
    avatar: "SC",
    content: "SiteForge saved us weeks of work. We launched our entire marketing site in an afternoon. The AI-generated copy was so good we barely made any changes.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "CEO, GrowthLabs",
    avatar: "MJ",
    content: "As a non-technical founder, I was amazed at how easy it was. The website looks like we hired an expensive agency. Our conversion rate jumped 40% after launch.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Marketing Director, Scale AI",
    avatar: "ER",
    content: "We use SiteForge for all our landing pages now. The speed and quality are unmatched. It understands our brand voice perfectly every time.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Founder, StartupKit",
    avatar: "DK",
    content: "I've tried every website builder out there. SiteForge is in a different league. It doesn't just build pages—it crafts compelling stories that sell.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Product Lead, Nexus",
    avatar: "LT",
    content: "The AI understood our complex B2B product better than most copywriters we've worked with. The resulting website exceeded all expectations.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "CTO, CloudBase",
    avatar: "JW",
    content: "From a developer's perspective, the clean code output impressed me. Easy to customize and integrate with our existing systems. Highly recommended.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary mb-6">
            Customer Stories
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Loved by <span className="gradient-text">50,000+ teams</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From startups to enterprises, teams trust SiteForge to build their online presence.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              className="glass-card p-6 flex flex-col animate-fade-in opacity-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-primary/30 mb-4" />

              {/* Content */}
              <p className="text-foreground/90 leading-relaxed flex-1 mb-6">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
