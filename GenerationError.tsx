import { AlertCircle, RefreshCw, Wifi, Server, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerationErrorProps {
  error: string;
  onRetry?: () => void;
}

const getErrorInfo = (error: string) => {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('groq api error') || lowerError.includes('400')) {
    return {
      icon: Server,
      title: "AI Service Temporarily Unavailable",
      message: "Our AI service is experiencing issues. This usually resolves quickly.",
      suggestion: "Please try again in a moment.",
    };
  }
  
  if (lowerError.includes('429') || lowerError.includes('rate limit')) {
    return {
      icon: Clock,
      title: "Too Many Requests",
      message: "You've made too many requests in a short time.",
      suggestion: "Please wait a few seconds before trying again.",
    };
  }
  
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return {
      icon: Wifi,
      title: "Connection Problem",
      message: "We couldn't reach our servers.",
      suggestion: "Please check your internet connection and try again.",
    };
  }
  
  if (lowerError.includes('timeout')) {
    return {
      icon: Clock,
      title: "Request Timed Out",
      message: "The generation took too long to complete.",
      suggestion: "Try a simpler prompt or try again.",
    };
  }
  
  return {
    icon: AlertCircle,
    title: "Generation Failed",
    message: "Something unexpected happened during generation.",
    suggestion: "Please try again. If the problem persists, try a different prompt.",
  };
};

export function GenerationError({ error, onRetry }: GenerationErrorProps) {
  const { icon: Icon, title, message, suggestion } = getErrorInfo(error);
  
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <div className="glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Icon className="h-8 w-8 text-destructive" />
            </div>
            
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {title}
            </h3>
            
            <p className="mb-2 text-muted-foreground">
              {message}
            </p>
            
            <p className="mb-6 text-sm text-muted-foreground/80">
              {suggestion}
            </p>
            
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
