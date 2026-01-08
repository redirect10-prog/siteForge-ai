import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OutputDisplay } from "@/components/OutputDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useStreamingGeneration, GeneratedContent } from "@/hooks/useStreamingGeneration";
import { useEditLimits } from "@/hooks/useEditLimits";

const FREE_EDIT_LIMIT = 3;

export default function EditWebsite() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [website, setWebsite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    generatedContent, 
    setGeneratedContent,
    editSection, 
    editingSectionIndex, 
    reorderSections, 
    deleteSection, 
    updateSectionImage,
    regenerateSectionImage,
    regeneratingIndex,
  } = useStreamingGeneration();
  
  const { 
    remainingEdits, 
    canEdit, 
    incrementEditCount, 
    loadWebsiteEditCount 
  } = useEditLimits();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchWebsite();
      loadWebsiteEditCount(id);
    }
  }, [user, id]);

  const fetchWebsite = async () => {
    if (!id) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("generated_websites")
      .select("*")
      .eq("id", id)
      .eq("user_id", user?.id)
      .maybeSingle();

    if (error || !data) {
      console.error("Error fetching website:", error);
      toast.error("Website not found");
      navigate("/my-websites");
      return;
    }

    setWebsite(data);
    
    // Convert to GeneratedContent format
    const sections = Array.isArray(data.sections) ? data.sections : [];
    const internalExplanation = data.internal_explanation || {
      websiteType: data.website_type || "Website",
      audience: data.target_audience || "",
      sectionRationale: "",
      copyStrategy: "",
      conversionGoal: "",
      tierImpact: "",
    };
    
    setGeneratedContent({
      websiteType: data.website_type || "Website",
      targetAudience: data.target_audience || "",
      sections: sections as GeneratedContent['sections'],
      internalExplanation: internalExplanation as GeneratedContent['internalExplanation'],
    });
    
    setIsLoading(false);
  };

  const handleEditSection = useCallback(async (sectionIndex: number, editInstructions: string) => {
    if (!canEdit) {
      toast.error("Edit limit reached. Upgrade to Pro for unlimited edits.");
      return;
    }
    
    await editSection(sectionIndex, editInstructions);
    await incrementEditCount();
  }, [editSection, canEdit, incrementEditCount]);

  const handleSave = async () => {
    if (!generatedContent || !id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("generated_websites")
        .update({
          sections: generatedContent.sections,
          internal_explanation: generatedContent.internalExplanation,
        })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error saving website:", error);
        toast.error("Failed to save changes");
        return;
      }

      toast.success("Changes saved!");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tier = website?.tier || "free";
  const editCount = website?.edit_count || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header tier={tier} requestsUsed={0} requestsLimit={3} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/my-websites">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{website?.website_type || "Edit Website"}</h1>
                <p className="text-sm text-muted-foreground">
                  {tier === "free" 
                    ? `${Math.max(0, FREE_EDIT_LIMIT - editCount)} edits remaining`
                    : "Unlimited edits"
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="gradient" 
              onClick={handleSave} 
              disabled={isSaving}
              className="relative z-10"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </span>
            </Button>
          </div>

          <OutputDisplay
            content={generatedContent}
            isVisible={!!generatedContent}
            prompt={website?.prompt || ""}
            tier={tier}
            onRegenerateImage={canEdit ? regenerateSectionImage : undefined}
            regeneratingIndex={regeneratingIndex}
            onEditSection={canEdit ? handleEditSection : undefined}
            editingSectionIndex={editingSectionIndex}
            onReorderSections={reorderSections}
            onDeleteSection={deleteSection}
            onUploadSectionImage={canEdit ? updateSectionImage : undefined}
            remainingEdits={remainingEdits}
            canEdit={canEdit}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
