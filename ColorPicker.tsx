import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  preview: string; // Hex for display
}

const colorSchemes: ColorScheme[] = [
  { name: "Ocean Blue", primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA", preview: "#3B82F6" },
  { name: "Forest Green", primary: "#22C55E", secondary: "#15803D", accent: "#4ADE80", preview: "#22C55E" },
  { name: "Sunset Orange", primary: "#F97316", secondary: "#C2410C", accent: "#FB923C", preview: "#F97316" },
  { name: "Royal Purple", primary: "#A855F7", secondary: "#7C3AED", accent: "#C084FC", preview: "#A855F7" },
  { name: "Rose Pink", primary: "#EC4899", secondary: "#BE185D", accent: "#F472B6", preview: "#EC4899" },
  { name: "Teal", primary: "#14B8A6", secondary: "#0D9488", accent: "#2DD4BF", preview: "#14B8A6" },
  { name: "Amber Gold", primary: "#F59E0B", secondary: "#D97706", accent: "#FBBF24", preview: "#F59E0B" },
  { name: "Slate Gray", primary: "#64748B", secondary: "#475569", accent: "#94A3B8", preview: "#64748B" },
];

interface ColorPickerProps {
  selectedColor: ColorScheme | null;
  onColorChange: (color: ColorScheme | null) => void;
  disabled?: boolean;
}

export function ColorPicker({ selectedColor, onColorChange, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            {selectedColor ? (
              <div
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: selectedColor.preview }}
              />
            ) : (
              <Palette className="h-4 w-4" />
            )}
            <span className="text-sm">{selectedColor?.name || "Auto"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-popover border border-border z-50" align="start">
          <Label className="text-xs text-muted-foreground mb-3 block">Color Theme</Label>
          <div className="grid grid-cols-4 gap-2">
            {/* Auto option */}
            <button
              onClick={() => {
                onColorChange(null);
                setOpen(false);
              }}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all hover:scale-110",
                selectedColor === null
                  ? "border-primary bg-secondary"
                  : "border-border hover:border-primary/50"
              )}
              title="Auto (AI chooses)"
            >
              <span className="text-xs font-medium text-muted-foreground">Auto</span>
              {selectedColor === null && (
                <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
            
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => {
                  onColorChange(scheme);
                  setOpen(false);
                }}
                className={cn(
                  "group relative h-10 w-10 rounded-lg border-2 transition-all hover:scale-110",
                  selectedColor?.name === scheme.name
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
                style={{ backgroundColor: scheme.preview }}
                title={scheme.name}
              >
                {selectedColor?.name === scheme.name && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { colorSchemes };