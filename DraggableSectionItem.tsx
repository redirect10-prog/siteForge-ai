import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Image, ImageOff, RefreshCw, Pencil, X, Check, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "./ImageUpload";
import { useAuth } from "@/contexts/AuthContext";

interface Section {
  name: string;
  heading: string;
  content: string;
  cta?: string;
  imagePrompt?: string;
  generatedImage?: string;
}

interface DraggableSectionItemProps {
  section: Section;
  index: number;
  id: string;
  editingPromptIndex: number | null;
  editedPrompt: string;
  regeneratingIndex: number | null;
  isGeneratingImages: boolean;
  showEditInput: number | null;
  editInstructions: string;
  editingSectionIndex: number | null;
  canDelete: boolean;
  onStartEditPrompt: (index: number, currentPrompt: string) => void;
  onCancelEditPrompt: () => void;
  onConfirmEditPrompt: (index: number) => void;
  onEditedPromptChange: (value: string) => void;
  onRegenerateImage?: (sectionIndex: number, customPrompt?: string) => void;
  onStartEdit: (index: number) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (index: number) => void;
  onEditInstructionsChange: (value: string) => void;
  onEditSection?: (sectionIndex: number, editInstructions: string) => Promise<void>;
  onDeleteSection?: (sectionIndex: number) => void;
  onUploadSectionImage?: (sectionIndex: number, imageUrl: string) => void;
}

export function DraggableSectionItem({
  section,
  index,
  id,
  editingPromptIndex,
  editedPrompt,
  regeneratingIndex,
  isGeneratingImages,
  showEditInput,
  editInstructions,
  editingSectionIndex,
  canDelete,
  onStartEditPrompt,
  onCancelEditPrompt,
  onConfirmEditPrompt,
  onEditedPromptChange,
  onRegenerateImage,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onEditInstructionsChange,
  onEditSection,
  onDeleteSection,
  onUploadSectionImage,
}: DraggableSectionItemProps) {
  const { user } = useAuth();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`p-6 animate-fade-in relative group/section ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Delete button */}
      {canDelete && onDeleteSection && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteSection(index)}
          className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover/section:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <div className="ml-8">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
          {section.name}
        </div>
        
        {/* Section image */}
        {editingPromptIndex === index ? (
          <div className="mb-4 rounded-lg bg-secondary/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Edit Image Prompt</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEditPrompt}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => onConfirmEditPrompt(index)}
                  disabled={!editedPrompt.trim()}
                  className="h-8 gap-1"
                >
                  <Check className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
            <Textarea
              value={editedPrompt}
              onChange={(e) => onEditedPromptChange(e.target.value)}
              placeholder="Describe the image you want..."
              className="min-h-[100px] resize-none"
              autoFocus
            />
          </div>
        ) : section.generatedImage ? (
          <div className="mb-4 rounded-lg overflow-hidden bg-secondary/30 relative group">
            {regeneratingIndex === index ? (
              <div className="w-full h-48 flex items-center justify-center bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Regenerating image...</span>
                </div>
              </div>
            ) : (
              <>
                <img 
                  src={section.generatedImage} 
                  alt={`${section.name} visual`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap">
                  {onRegenerateImage && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => onRegenerateImage(index)}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStartEditPrompt(index, section.imagePrompt || "")}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Prompt
                  </Button>
                  {user && onUploadSectionImage && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const { supabase } = await import("@/integrations/supabase/client");
                            const fileExt = file.name.split(".").pop();
                            const fileName = `${Date.now()}-section.${fileExt}`;
                            const filePath = `${user.id}/${fileName}`;
                            const { error } = await supabase.storage
                              .from("website-assets")
                              .upload(filePath, file);
                            if (!error) {
                              const { data: { publicUrl } } = supabase.storage
                                .from("website-assets")
                                .getPublicUrl(filePath);
                              onUploadSectionImage(index, publicUrl);
                            }
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </label>
                  )}
                </div>
              </>
            )}
          </div>
        ) : section.imagePrompt && (isGeneratingImages || regeneratingIndex === index) ? (
          <div className="mb-4 rounded-lg bg-secondary/30 h-48 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating image...</span>
            </div>
          </div>
        ) : section.imagePrompt ? (
          <div className="mb-4 rounded-lg bg-secondary/30 h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ImageOff className="h-5 w-5" />
              <span className="text-sm">Image pending</span>
            </div>
            {onRegenerateImage && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRegenerateImage(index)}
                  className="gap-2"
                >
                  <Image className="h-4 w-4" />
                  Generate
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onStartEditPrompt(index, section.imagePrompt || "")}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Prompt
                </Button>
              </div>
            )}
          </div>
        ) : null}
        
        <h3 className="mb-3 text-2xl font-bold">{section.heading}</h3>
        <p className="text-muted-foreground leading-relaxed">{section.content}</p>
        {section.cta && (
          <div className="mt-4">
            <Button variant="gradient" size="sm" className="relative z-10">
              <span className="relative z-10">{section.cta}</span>
            </Button>
          </div>
        )}
        
        {/* AI Edit Section */}
        {onEditSection && (
          <div className="mt-4 pt-4 border-t border-border/30">
            {showEditInput === index ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Edit</span>
                </div>
                <Input
                  value={editInstructions}
                  onChange={(e) => onEditInstructionsChange(e.target.value)}
                  placeholder="e.g., Make it more engaging, shorten the text, add urgency..."
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitEdit(index);
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => onSubmitEdit(index)}
                    disabled={!editInstructions.trim() || editingSectionIndex === index}
                    className="gap-2"
                  >
                    {editingSectionIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Apply Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartEdit(index)}
                className="gap-2 text-muted-foreground hover:text-foreground"
                disabled={editingSectionIndex !== null}
              >
                {editingSectionIndex === index ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Edit with AI
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
