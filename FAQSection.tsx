import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does SiteForge AI generate websites?",
    answer: "SiteForge uses advanced large language models trained on millions of successful websites. When you describe your business, our AI analyzes your requirements, industry best practices, and conversion optimization principles to generate tailored website content, structure, and design suggestions in seconds.",
  },
  {
    question: "Can I customize the generated website?",
    answer: "Absolutely! Every generated website is fully customizable. You can edit text, change layouts, add sections, and modify styling. Think of SiteForge as your starting point—we give you a professional foundation that you can refine to match your exact vision.",
  },
  {
    question: "What types of websites can SiteForge create?",
    answer: "SiteForge excels at creating landing pages, business websites, portfolios, SaaS marketing sites, agency websites, and e-commerce stores. Our AI understands different industries and tailors the content accordingly—from tech startups to law firms to creative agencies.",
  },
  {
    question: "Do I need any technical skills to use SiteForge?",
    answer: "Not at all. SiteForge is designed for everyone, regardless of technical background. Just describe what you want in plain language, and our AI handles everything else. No coding, no design skills, no complicated tools to learn.",
  },
  {
    question: "How does the free plan work?",
    answer: "Our free plan gives you 3 website generations per month with access to basic templates and standard support. It's perfect for trying out SiteForge or for personal projects. When you need more, simply upgrade to Pro for unlimited generations and premium features.",
  },
  {
    question: "Can I export my website and host it elsewhere?",
    answer: "Yes! All plans allow you to export your website as clean HTML, CSS, and JavaScript. You can host it on any platform you prefer—from Netlify and Vercel to traditional hosting providers. Pro and Enterprise plans also offer direct publishing options.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. All data is encrypted in transit and at rest. We never share your content with third parties, and our AI processes are designed with privacy in mind. Enterprise customers can also opt for on-premise deployment for maximum security.",
  },
  {
    question: "What if I'm not satisfied with my purchase?",
    answer: "We offer a 14-day money-back guarantee on all paid plans. If SiteForge doesn't meet your expectations, simply contact our support team for a full refund. No questions asked.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary mb-6">
            FAQ
          </div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about SiteForge. Can't find an answer? Reach out to our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass-card px-6 border-none animate-fade-in opacity-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
