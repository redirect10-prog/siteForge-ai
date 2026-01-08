import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock } from "lucide-react";

const ESTIMATED_TIME_SECONDS = 12;

const GENERATION_STEPS = [
  { label: "Analyzing your prompt...", progress: 15 },
  { label: "Designing website structure...", progress: 35 },
  { label: "Generating content sections...", progress: 55 },
  { label: "Creating navigation...", progress: 70 },
  { label: "Building backend config...", progress: 85 },
  { label: "Finalizing website...", progress: 95 },
];

export function GenerationSkeleton() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(Math.floor(elapsed));
      
      // Simulate progress with easing (slows down as it approaches 100)
      const targetProgress = Math.min(95, (elapsed / ESTIMATED_TIME_SECONDS) * 100);
      setProgress(prev => prev + (targetProgress - prev) * 0.1);
      
      // Update step based on progress
      const stepIndex = GENERATION_STEPS.findIndex(step => step.progress > targetProgress);
      setCurrentStep(stepIndex === -1 ? GENERATION_STEPS.length - 1 : Math.max(0, stepIndex - 1));
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  const remainingTime = Math.max(0, ESTIMATED_TIME_SECONDS - elapsedTime);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          {/* Progress header */}
          <div className="mb-8 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-lg font-medium">
                {GENERATION_STEPS[currentStep]?.label || "Generating..."}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="max-w-md mx-auto mb-3">
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Time estimate */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {remainingTime > 0 
                  ? `About ${remainingTime}s remaining` 
                  : "Almost done..."}
              </span>
            </div>
          </div>

          {/* Hero section skeleton */}
          <div className="glass-card mb-6 overflow-hidden animate-fade-in">
            <div className="p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                  <div className="flex gap-3 pt-4">
                    <Skeleton className="h-11 w-32" />
                    <Skeleton className="h-11 w-28" />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Skeleton className="h-48 w-64 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation skeleton */}
          <div className="glass-card mb-6 p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-18" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          {/* Features section skeleton */}
          <div className="glass-card mb-6 p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-48 mx-auto mb-3" />
              <Skeleton className="h-5 w-72 mx-auto" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-secondary/30 p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Pricing section skeleton */}
          <div className="glass-card mb-6 p-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-36 mx-auto mb-3" />
              <Skeleton className="h-5 w-56 mx-auto" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-secondary/30 p-6">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-10 w-28 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  <Skeleton className="h-11 w-full mt-6" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA section skeleton */}
          <div className="glass-card p-8 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Skeleton className="h-8 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-80 mx-auto mb-6" />
            <Skeleton className="h-12 w-40 mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
