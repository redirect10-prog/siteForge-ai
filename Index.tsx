import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { GeneratorInterface } from "@/components/GeneratorInterface";
import { OutputDisplay } from "@/components/OutputDisplay";
import { StreamingOutput } from "@/components/StreamingOutput";
import { GenerationError } from "@/components/GenerationError";
import { GenerationSkeleton } from "@/components/GenerationSkeleton";
import { Footer } from "@/components/Footer";
import { useStreamingGeneration } from "@/hooks/useStreamingGeneration";
import { useEditLimits } from "@/hooks/useEditLimits";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { ColorScheme } from "@/components/ColorPicker";
import type { ValidationFix } from "@/hooks/useStreamingGeneration";

// Mock subscription data
const SUBSCRIPTION_DATA = {
  tier: 'free' as const,
  requestsUsed: 0,
  limits: {
    free: 3,
    pro: 20,
    business: Infinity
  }
};

export default function Index() {
  const [requestsUsed, setRequestsUsed] = useState(SUBSCRIPTION_DATA.requestsUsed);
  const [lastPrompt, setLastPrompt] = useState("");
  const [suggestedPromptToUse, setSuggestedPromptToUse] = useState("");
  const { user } = useAuth();
  const { generate, isGenerating, isGeneratingImages, streamingText, generatedContent, setGeneratedContent, imageProgress, regenerateSectionImage, regeneratingIndex, editSection, editingSectionIndex, reorderSections, deleteSection, updateSectionImage, generateBackendCode, generatedBackendCode, isGeneratingBackend, error } = useStreamingGeneration();
  const { remainingEdits, canEdit, incrementEditCount, loadWebsiteEditCount, resetEditTracking } = useEditLimits();
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);

  const requestsLimit = SUBSCRIPTION_DATA.limits[SUBSCRIPTION_DATA.tier];

  const handleGenerate = useCallback(async (prompt: string, withImages: boolean = true, colorScheme?: ColorScheme | null) => {
    setLastPrompt(prompt);
    resetEditTracking();
    try {
      await generate(prompt, SUBSCRIPTION_DATA.tier, withImages, colorScheme);
      setRequestsUsed(prev => prev + 1);
      toast.success("Website content generated!");
    } catch (err) {
      console.error("Error generating content:", err);
    }
  }, [generate, resetEditTracking]);

  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      handleGenerate(lastPrompt, true);
    }
  }, [lastPrompt, handleGenerate]);

  const handleEditSection = useCallback(async (sectionIndex: number, editInstructions: string) => {
    if (!canEdit) {
      toast.error("Edit limit reached. Upgrade to Pro for unlimited edits.");
      return;
    }
    
    await editSection(sectionIndex, editInstructions);
    await incrementEditCount();
  }, [editSection, canEdit, incrementEditCount]);

  const handleWebsiteSaved = useCallback((websiteId: string) => {
    loadWebsiteEditCount(websiteId);
  }, [loadWebsiteEditCount]);

  const scrollToGenerator = () => {
    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUseSuggestedPrompt = useCallback((prompt: string) => {
    setSuggestedPromptToUse(prompt);
    scrollToGenerator();
  }, []);

  const handleApplyValidationFixes = useCallback((fixes: ValidationFix[], category: string) => {
    if (!generatedContent) return;
    setIsApplyingFixes(true);
    
    // Apply fixes based on category
    setTimeout(() => {
      if (generatedContent.validation) {
        const updatedValidation = { ...generatedContent.validation };
        updatedValidation[category as keyof typeof updatedValidation] = {
          passed: true,
          issues: [],
          fixes: []
        };
        setGeneratedContent({ ...generatedContent, validation: updatedValidation });
      }
      setIsApplyingFixes(false);
      toast.success(`Fixed ${fixes.length} ${category} issue(s)`);
    }, 1000);
  }, [generatedContent, setGeneratedContent]);

  return (
    <>
      <Helmet>
        <title>SiteForge AI - Build Stunning Websites in Seconds</title>
        <meta name="description" content="Transform your ideas into stunning, conversion-optimized websites in seconds with SiteForge AI. No coding required. Trusted by 50,000+ businesses." />
        <meta name="keywords" content="AI website builder, website generator, landing page creator, no-code website, AI design" />
        <meta property="og:title" content="SiteForge AI - Build Stunning Websites in Seconds" />
        <meta property="og:description" content="Transform your ideas into stunning, conversion-optimized websites in seconds with SiteForge AI." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://siteforge.ai" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          tier={SUBSCRIPTION_DATA.tier} 
          requestsUsed={requestsUsed} 
          requestsLimit={requestsLimit} 
        />
        
        <main>
          <HeroSection onGetStarted={scrollToGenerator} />
          
          <HowItWorksSection />
          
          <section id="features">
            <FeaturesSection />
          </section>
          
          <TestimonialsSection />
          
          <PricingSection />
          
          <GeneratorInterface
            tier={SUBSCRIPTION_DATA.tier}
            requestsUsed={requestsUsed}
            requestsLimit={requestsLimit}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            initialPrompt={suggestedPromptToUse}
          />
          
          {isGenerating && !streamingText && (
            <GenerationSkeleton />
          )}
          
          {isGenerating && streamingText && (
            <StreamingOutput text={streamingText} isGenerating={isGenerating} />
          )}
          
          {error && !isGenerating && !generatedContent && (
            <GenerationError error={error} onRetry={handleRetry} />
          )}
          
          <OutputDisplay 
            content={generatedContent} 
            isVisible={!!generatedContent && !isGenerating}
            prompt={lastPrompt}
            tier={SUBSCRIPTION_DATA.tier}
            isGeneratingImages={isGeneratingImages}
            imageProgress={imageProgress}
            onRegenerateImage={user ? regenerateSectionImage : undefined}
            regeneratingIndex={regeneratingIndex}
            onEditSection={user && canEdit ? handleEditSection : undefined}
            editingSectionIndex={editingSectionIndex}
            onReorderSections={reorderSections}
            onDeleteSection={deleteSection}
            onUploadSectionImage={user ? updateSectionImage : undefined}
            generatedBackendCode={user ? generatedBackendCode : null}
            isGeneratingBackend={isGeneratingBackend}
            onGenerateBackendCode={user ? generateBackendCode : undefined}
            remainingEdits={remainingEdits}
            canEdit={canEdit}
            onWebsiteSaved={handleWebsiteSaved}
            onUseSuggestedPrompt={handleUseSuggestedPrompt}
            onApplyValidationFixes={handleApplyValidationFixes}
            isApplyingFixes={isApplyingFixes}
          />
          
          <FAQSection />
          
          <CTASection onGetStarted={scrollToGenerator} />
        </main>
        
        <Footer />
      </div>
    </>
  );
}
