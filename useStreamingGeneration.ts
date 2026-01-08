import { useState, useCallback } from "react";
import { ColorScheme } from "@/components/ColorPicker";
import { supabase } from "@/integrations/supabase/client";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website`;
const GENERATE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const EDIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-website`;
const GENERATE_BACKEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-backend`;

async function getBearerToken(required: boolean): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) return `Bearer ${token}`;
  if (required) throw new Error("Please sign in to use this feature.");

  // Anonymous calls (allowed for generate-website)
  return `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
}
export interface AuthConfig {
  enabled: boolean;
  providers: string[];
  requireEmailVerification: boolean;
  allowSignup: boolean;
  redirectAfterLogin: string;
  userProfileFields: string[];
  roles: string[];
}

export interface BackendSpec {
  features: string[];
  hasAuth?: boolean;
  authConfig?: AuthConfig;
  database: {
    tables: Array<{
      name: string;
      description: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        description: string;
      }>;
      hasRLS?: boolean;
      rlsPolicy?: string;
    }>;
  };
  forms: Array<{
    id: string;
    name: string;
    description: string;
    targetTable: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
    }>;
    submitButton: string;
    successMessage: string;
    requiresAuth?: boolean;
  }>;
  apiEndpoints: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
    requiresAuth: boolean;
  }>;
  emailNotifications?: Array<{
    trigger: string;
    recipient: string;
    subject: string;
    description: string;
  }>;
}

export interface ValidationFix {
  type: string;
  [key: string]: string | boolean | undefined;
}

export interface ValidationCategory {
  passed: boolean;
  issues: string[];
  fixes: ValidationFix[];
}

export interface ValidationResult {
  navigation: ValidationCategory;
  buttons: ValidationCategory;
  security: ValidationCategory;
  forms: ValidationCategory;
}

export interface NavigationItem {
  label: string;
  target: string;
  type: string;
  isWorking: boolean;
  issue: string | null;
}

export interface GeneratedBackendCode {
  sql: string;
  forms: Array<{
    id: string;
    name: string;
    code: string;
    filename: string;
  }>;
  edgeFunctions: Array<{
    name: string;
    path: string;
    code: string;
    filename: string;
  }>;
}

export interface GeneratedContent {
  websiteType: string;
  targetAudience: string;
  sections: {
    name: string;
    heading: string;
    content: string;
    cta?: string;
    ctaAction?: string;
    ctaTarget?: string;
    imagePrompt?: string;
    generatedImage?: string;
    hasForm?: boolean;
    formType?: string;
  }[];
  navigation?: NavigationItem[];
  validation?: ValidationResult;
  suggestedPrompts?: string[];
  backend?: BackendSpec;
  internalExplanation: {
    websiteType: string;
    audience: string;
    sectionRationale: string;
    copyStrategy: string;
    conversionGoal: string;
    tierImpact: string;
    backendRationale?: string;
    securityAnalysis?: string;
  };
}

function normalizeGeneratedContent(input: any): GeneratedContent {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid response from AI");
  }

  // Support older formats where result is a JSON string
  const obj = input as any;

  const rawSections = Array.isArray(obj.sections) ? obj.sections : [];
  const sections = rawSections.map((s: any) => {
    const title = s?.name ?? s?.title ?? "Section";
    const heading = s?.heading ?? s?.title ?? title;
    const content = typeof s?.content === "string" ? s.content : "";

    return {
      name: title,
      heading,
      content,
      cta: s?.cta ?? s?.callToAction ?? null,
      ctaAction: s?.ctaAction ?? undefined,
      ctaTarget: s?.ctaTarget ?? undefined,
      imagePrompt: s?.imagePrompt ?? undefined,
      generatedImage: s?.generatedImage ?? undefined,
      hasForm: s?.hasForm ?? (s?.form ? true : undefined),
      formType: s?.formType ?? undefined,
    };
  });

  const rawNav = Array.isArray(obj.navigation) ? obj.navigation : [];
  const navigation: NavigationItem[] = rawNav.map((n: any) => {
    const label = n?.label ?? n?.title ?? "Link";
    const target = n?.target ?? n?.link ?? "#";

    return {
      label,
      target,
      type: n?.type ?? "scroll",
      isWorking: n?.isWorking ?? true,
      issue: n?.issue ?? null,
    };
  });

  const internalExplanation =
    obj.internalExplanation && typeof obj.internalExplanation === "object"
      ? obj.internalExplanation
      : {
          websiteType: String(obj.websiteType ?? ""),
          audience: String(obj.targetAudience ?? ""),
          sectionRationale: String(obj.internalExplanation ?? ""),
          copyStrategy: "",
          conversionGoal: "",
          tierImpact: "",
        };

  return {
    websiteType: String(obj.websiteType ?? "landing"),
    targetAudience: String(obj.targetAudience ?? ""),
    sections,
    navigation,
    validation: obj.validation,
    suggestedPrompts: Array.isArray(obj.suggestedPrompts) ? obj.suggestedPrompts : undefined,
    backend: obj.backend && typeof obj.backend === "object" && obj.backend.database?.tables ? obj.backend : undefined,
    internalExplanation,
  } as GeneratedContent;
}

export function useStreamingGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingBackend, setIsGeneratingBackend] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedBackendCode, setGeneratedBackendCode] = useState<GeneratedBackendCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  const generateImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const auth = await getBearerToken(true);

      const response = await fetch(GENERATE_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        console.error("Image generation failed:", response.status);
        return null;
      }

      const data = await response.json();
      return data.image || null;
    } catch (err) {
      console.error("Error generating image:", err);
      return null;
    }
  }, []);

  const regenerateSectionImage = useCallback(async (sectionIndex: number, customPrompt?: string) => {
    if (!generatedContent || !generatedContent.sections[sectionIndex]) {
      return;
    }

    const section = generatedContent.sections[sectionIndex];
    const promptToUse = customPrompt || section.imagePrompt;
    
    if (!promptToUse) {
      return;
    }

    setRegeneratingIndex(sectionIndex);
    try {
      const newImage = await generateImage(promptToUse);
      
      if (newImage) {
        const updatedSections = [...generatedContent.sections];
        updatedSections[sectionIndex] = { 
          ...section, 
          generatedImage: newImage,
          imagePrompt: promptToUse // Update the prompt if it was customized
        };
        setGeneratedContent({ ...generatedContent, sections: updatedSections });
      }
    } finally {
      setRegeneratingIndex(null);
    }
  }, [generatedContent, generateImage]);

  const generate = useCallback(async (prompt: string, tier: string, withImages = true, colorScheme?: ColorScheme | null) => {
    setIsGenerating(true);
    setStreamingText("");
    setGeneratedContent(null);
    setError(null);
    setImageProgress({ current: 0, total: 0 });

    try {
      const auth = await getBearerToken(false);

      const response = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ 
          prompt, 
          tier,
          colorScheme: colorScheme ? {
            name: colorScheme.name,
            primary: colorScheme.primary,
            secondary: colorScheme.secondary,
            accent: colorScheme.accent,
          } : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // The edge function returns { result: <parsed content> }
      const rawResult = data.result;
      const parsed = normalizeGeneratedContent(
        typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult
      );
      
      if (!parsed.sections?.length) {
        throw new Error("Invalid response from AI");
      }

      setGeneratedContent(parsed);
      setStreamingText("");
      setIsGenerating(false);

      // Generate images for sections if enabled
      if (withImages && parsed.sections) {
        setIsGeneratingImages(true);
        const sectionsWithImagePrompts = parsed.sections.filter(s => s.imagePrompt);
        setImageProgress({ current: 0, total: sectionsWithImagePrompts.length });

        // Generate images sequentially to avoid rate limits
        for (let i = 0; i < parsed.sections.length; i++) {
          const section = parsed.sections[i];
          if (section.imagePrompt) {
            const image = await generateImage(section.imagePrompt);
            if (image) {
              parsed.sections[i] = { ...section, generatedImage: image };
              setGeneratedContent({ ...parsed });
            }
            setImageProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
        }

        setIsGeneratingImages(false);
      }
      
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate content";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
      setIsGeneratingImages(false);
    }
  }, [generateImage]);

  const editSection = useCallback(async (sectionIndex: number, editInstructions: string) => {
    if (!generatedContent || !generatedContent.sections[sectionIndex]) {
      return;
    }

    setEditingSectionIndex(sectionIndex);
    try {
      const section = generatedContent.sections[sectionIndex];
      const auth = await getBearerToken(true);
      
      const response = await fetch(EDIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ 
          section,
          editInstructions 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.section) {
        const updatedSections = [...generatedContent.sections];
        updatedSections[sectionIndex] = { 
          ...section,
          ...data.section,
          generatedImage: section.generatedImage // Keep existing image
        };
        setGeneratedContent({ ...generatedContent, sections: updatedSections });
      }
    } catch (err) {
      console.error("Error editing section:", err);
      throw err;
    } finally {
      setEditingSectionIndex(null);
    }
  }, [generatedContent]);

  const reorderSections = useCallback((newSections: GeneratedContent['sections']) => {
    if (!generatedContent) return;
    setGeneratedContent({ ...generatedContent, sections: newSections });
  }, [generatedContent]);

  const deleteSection = useCallback((sectionIndex: number) => {
    if (!generatedContent || generatedContent.sections.length <= 1) return;
    const newSections = generatedContent.sections.filter((_, i) => i !== sectionIndex);
    setGeneratedContent({ ...generatedContent, sections: newSections });
  }, [generatedContent]);

  const updateSectionImage = useCallback((sectionIndex: number, imageUrl: string) => {
    if (!generatedContent || !generatedContent.sections[sectionIndex]) return;
    const updatedSections = [...generatedContent.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      generatedImage: imageUrl,
    };
    setGeneratedContent({ ...generatedContent, sections: updatedSections });
  }, [generatedContent]);

  const generateBackendCode = useCallback(async () => {
    if (!generatedContent?.backend) return;

    setIsGeneratingBackend(true);
    try {
      const auth = await getBearerToken(true);

      const response = await fetch(GENERATE_BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ backend: generatedContent.backend }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.code) {
        setGeneratedBackendCode(data.code);
      }
    } catch (err) {
      console.error("Error generating backend code:", err);
      throw err;
    } finally {
      setIsGeneratingBackend(false);
    }
  }, [generatedContent]);

  return {
    generate,
    isGenerating,
    isGeneratingImages,
    isGeneratingBackend,
    streamingText,
    generatedContent,
    generatedBackendCode,
    error,
    setGeneratedContent,
    imageProgress,
    regenerateSectionImage,
    regeneratingIndex,
    editSection,
    editingSectionIndex,
    reorderSections,
    deleteSection,
    updateSectionImage,
    generateBackendCode,
  };
}
