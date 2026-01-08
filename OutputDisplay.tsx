import { Copy, Download, Eye, Code, Share2, ExternalLink, Loader2, Server, Lock, LogIn, Edit3, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import FreeTierBadge from "@/components/FreeTierBadge";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableSectionItem } from "./DraggableSectionItem";
import { BackendCodeDisplay } from "./BackendCodeDisplay";
import { ValidationDisplay } from "./ValidationDisplay";
import { Image as ImageIcon } from "lucide-react";
import type { BackendSpec, GeneratedBackendCode, ValidationResult, ValidationFix, NavigationItem } from "@/hooks/useStreamingGeneration";

interface GeneratedContent {
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

interface OutputDisplayProps {
  content: GeneratedContent | null;
  isVisible: boolean;
  prompt?: string;
  tier?: string;
  isGeneratingImages?: boolean;
  imageProgress?: { current: number; total: number };
  onRegenerateImage?: (sectionIndex: number, customPrompt?: string) => void;
  regeneratingIndex?: number | null;
  onUpdateSectionPrompt?: (sectionIndex: number, newPrompt: string) => void;
  onEditSection?: (sectionIndex: number, editInstructions: string) => Promise<void>;
  editingSectionIndex?: number | null;
  onReorderSections?: (sections: GeneratedContent['sections']) => void;
  onDeleteSection?: (sectionIndex: number) => void;
  onUploadSectionImage?: (sectionIndex: number, imageUrl: string) => void;
  generatedBackendCode?: GeneratedBackendCode | null;
  isGeneratingBackend?: boolean;
  onGenerateBackendCode?: () => void;
  remainingEdits?: number;
  canEdit?: boolean;
  onWebsiteSaved?: (websiteId: string) => void;
  onUseSuggestedPrompt?: (prompt: string) => void;
  onApplyValidationFixes?: (fixes: ValidationFix[], category: string) => void;
  isApplyingFixes?: boolean;
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function OutputDisplay({ 
  content, 
  isVisible, 
  prompt = "", 
  tier = "free",
  isGeneratingImages = false,
  imageProgress = { current: 0, total: 0 },
  onRegenerateImage,
  regeneratingIndex = null,
  onUpdateSectionPrompt,
  onEditSection,
  editingSectionIndex = null,
  onReorderSections,
  onDeleteSection,
  onUploadSectionImage,
  generatedBackendCode = null,
  isGeneratingBackend = false,
  onGenerateBackendCode,
  remainingEdits = Infinity,
  canEdit = true,
  onWebsiteSaved,
  onUseSuggestedPrompt,
  onApplyValidationFixes,
  isApplyingFixes = false
}: OutputDisplayProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'backend' | 'validation' | 'explanation'>('preview');
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [showEditInput, setShowEditInput] = useState<number | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStartEditPrompt = (index: number, currentPrompt: string) => {
    setEditingPromptIndex(index);
    setEditedPrompt(currentPrompt);
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptIndex(null);
    setEditedPrompt("");
  };

  const handleConfirmEditPrompt = (index: number) => {
    if (onRegenerateImage && editedPrompt.trim()) {
      onRegenerateImage(index, editedPrompt.trim());
    }
    setEditingPromptIndex(null);
    setEditedPrompt("");
  };

  const handleStartEdit = (index: number) => {
    setShowEditInput(index);
    setEditInstructions("");
  };

  const handleCancelEdit = () => {
    setShowEditInput(null);
    setEditInstructions("");
  };

  const handleSubmitEdit = async (index: number) => {
    if (onEditSection && editInstructions.trim()) {
      await onEditSection(index, editInstructions.trim());
      setShowEditInput(null);
      setEditInstructions("");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && content && onReorderSections) {
      const oldIndex = content.sections.findIndex((_, i) => `section-${i}` === active.id);
      const newIndex = content.sections.findIndex((_, i) => `section-${i}` === over.id);
      
      const newSections = arrayMove(content.sections, oldIndex, newIndex);
      onReorderSections(newSections);
      toast.success("Section order updated");
    }
  };

  if (!isVisible || !content) return null;

  const handleCopy = () => {
    const textContent = content.sections
      .map(s => `${s.heading}\n${s.content}${s.cta ? `\n${s.cta}` : ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(textContent);
    toast.success("Content copied to clipboard");
  };

  const handleShare = async () => {
    if (!user) {
      toast.error("Please sign in to save and share your website");
      navigate("/auth");
      return;
    }

    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
      return;
    }

    setIsSharing(true);
    try {
      const slug = generateSlug();
      
      const { data, error } = await supabase.from("generated_websites").insert({
        slug,
        prompt,
        website_type: content.websiteType,
        target_audience: content.targetAudience,
        sections: content.sections,
        internal_explanation: content.internalExplanation,
        tier,
        user_id: user.id,
      }).select("id").single();

      if (error) {
        console.error("Error saving website:", error);
        toast.error("Failed to generate share link");
        return;
      }

      // Notify parent about saved website for edit tracking
      if (data?.id && onWebsiteSaved) {
        onWebsiteSaved(data.id);
      }

      const url = `${window.location.origin}/site/${slug}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      toast.success("Share link created and copied!");
    } catch (err) {
      console.error("Error sharing:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSharing(false);
    }
  };

  const handleViewSite = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const progressPercent = imageProgress.total > 0 
    ? (imageProgress.current / imageProgress.total) * 100 
    : 0;

  const sectionIds = content.sections.map((_, index) => `section-${index}`);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Image generation progress */}
          {isGeneratingImages && (
            <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <ImageIcon className="h-5 w-5 text-accent animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Generating images... ({imageProgress.current}/{imageProgress.total})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AI is creating custom images for your website sections
                  </p>
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Output header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-border bg-secondary/50 p-1">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'preview' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                {content.backend && (
                  <button
                    onClick={() => setViewMode('backend')}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      viewMode === 'backend' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Server className="h-4 w-4" />
                    Backend
                  </button>
                )}
                {content.validation && (
                  <button
                    onClick={() => setViewMode('validation')}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      viewMode === 'validation' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Validation
                    {!content.validation.navigation.passed || 
                     !content.validation.buttons.passed || 
                     !content.validation.security.passed || 
                     !content.validation.forms.passed ? (
                      <span className="ml-1 h-2 w-2 rounded-full bg-orange-500" />
                    ) : null}
                  </button>
                )}
                <button
                  onClick={() => setViewMode('explanation')}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'explanation' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  Internal
                </button>
              </div>
              {onReorderSections && viewMode === 'preview' && (
                <span className="text-xs text-muted-foreground">
                  Drag sections to reorder
                </span>
              )}
              {tier === "free" && remainingEdits !== Infinity && (
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                  remainingEdits > 0 
                    ? "bg-accent/10 text-accent" 
                    : "bg-destructive/10 text-destructive"
                }`}>
                  <Edit3 className="h-3 w-3" />
                  <span>{remainingEdits} edit{remainingEdits !== 1 ? 's' : ''} left</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button 
                variant={user ? "gradient" : "outline"}
                size="sm" 
                onClick={handleShare}
                disabled={isSharing}
                className={user ? "relative z-10" : ""}
              >
                <span className={user ? "relative z-10 flex items-center gap-2" : "flex items-center gap-2"}>
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !user ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {shareUrl ? "Copy Link" : user ? "Share" : "Sign in to Share"}
                </span>
              </Button>
              {shareUrl && (
                <Button variant="outline" size="sm" onClick={handleViewSite}>
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
              )}
            </div>
          </div>

          {/* Share URL display */}
          {shareUrl && (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Your website is live!</p>
                  <a 
                    href={shareUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                  >
                    {shareUrl}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Content display */}
          <div className="glass-card overflow-hidden">
            {viewMode === 'preview' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sectionIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border/50">
                    {content.sections.map((section, index) => (
                      <DraggableSectionItem
                        key={`section-${index}`}
                        id={`section-${index}`}
                        section={section}
                        index={index}
                        editingPromptIndex={editingPromptIndex}
                        editedPrompt={editedPrompt}
                        regeneratingIndex={regeneratingIndex}
                        isGeneratingImages={isGeneratingImages}
                        showEditInput={showEditInput}
                        editInstructions={editInstructions}
                        editingSectionIndex={editingSectionIndex}
                        canDelete={content.sections.length > 1}
                        onStartEditPrompt={handleStartEditPrompt}
                        onCancelEditPrompt={handleCancelEditPrompt}
                        onConfirmEditPrompt={handleConfirmEditPrompt}
                        onEditedPromptChange={setEditedPrompt}
                        onRegenerateImage={onRegenerateImage}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSubmitEdit={handleSubmitEdit}
                        onEditInstructionsChange={setEditInstructions}
                        onEditSection={onEditSection}
                        onDeleteSection={onDeleteSection}
                        onUploadSectionImage={onUploadSectionImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : viewMode === 'backend' && content.backend ? (
              <div className="p-6">
                <BackendCodeDisplay
                  backend={content.backend}
                  generatedCode={generatedBackendCode}
                  isGenerating={isGeneratingBackend}
                  onGenerateCode={onGenerateBackendCode || (() => {})}
                />
              </div>
            ) : viewMode === 'validation' && content.validation ? (
              <div className="p-6">
                <ValidationDisplay
                  validation={content.validation}
                  onApplyFixes={onApplyValidationFixes || (() => {})}
                  isApplyingFixes={isApplyingFixes}
                />
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-accent mb-2">
                    Internal Explanation (SiteForge Team Only)
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Website Type:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.websiteType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Target Audience:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.audience}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Section Rationale:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.sectionRationale}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Copywriting Strategy:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.copyStrategy}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Conversion Goal:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.conversionGoal}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Tier Impact:</span>{" "}
                      <span className="text-muted-foreground">{content.internalExplanation.tierImpact}</span>
                    </div>
                    {content.internalExplanation.securityAnalysis && (
                      <div>
                        <span className="font-medium text-foreground">Security Analysis:</span>{" "}
                        <span className="text-muted-foreground">{content.internalExplanation.securityAnalysis}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          {content.suggestedPrompts && content.suggestedPrompts.length > 0 && onUseSuggestedPrompt && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Try these next
              </h3>
              <div className="flex flex-wrap gap-2">
                {content.suggestedPrompts.map((suggestedPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => onUseSuggestedPrompt(suggestedPrompt)}
                    className="group text-left text-sm px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary transition-all"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {suggestedPrompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Free Tier Badge */}
          {tier === "free" && <FreeTierBadge />}
        </div>
      </div>
    </section>
  );
}
