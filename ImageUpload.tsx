import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  type: "logo" | "section" | "background";
  className?: string;
}

export function ImageUpload({ onUpload, currentImage, type, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error("Please sign in to upload images");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("website-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("website-assets")
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUpload(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPlaceholderText = () => {
    switch (type) {
      case "logo":
        return "Upload logo";
      case "section":
        return "Upload image";
      case "background":
        return "Upload background";
      default:
        return "Upload";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative rounded-lg overflow-hidden bg-secondary/30 group">
          <img
            src={preview}
            alt="Uploaded"
            className={`w-full object-cover ${type === "logo" ? "h-16" : "h-32"}`}
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Replace
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !user}
          className={`w-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            type === "logo" ? "h-16 p-2" : "h-32 p-4"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">{user ? getPlaceholderText() : "Sign in to upload"}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
