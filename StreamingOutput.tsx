import { Loader2 } from "lucide-react";

interface StreamingOutputProps {
  text: string;
  isGenerating: boolean;
}

export function StreamingOutput({ text, isGenerating }: StreamingOutputProps) {
  if (!isGenerating && !text) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Generating website content...
              </span>
            </div>
            <div className="font-mono text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
              {text || "Starting generation..."}
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
