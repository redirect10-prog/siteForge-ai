import { useState } from "react";
import { Check, X, AlertTriangle, Shield, Navigation, MousePointer, FileText, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ValidationResult, ValidationFix, GeneratedContent } from "@/hooks/useStreamingGeneration";

interface ValidationDisplayProps {
  validation: ValidationResult | undefined;
  onApplyFixes: (fixes: ValidationFix[], category: string) => void;
  isApplyingFixes?: boolean;
}

const categoryConfig = {
  navigation: {
    icon: Navigation,
    label: "Navigation Links",
    description: "Checks all nav items link to valid sections/pages",
  },
  buttons: {
    icon: MousePointer,
    label: "Buttons & CTAs",
    description: "Validates all buttons have proper actions",
  },
  security: {
    icon: Shield,
    label: "Security Measures",
    description: "Verifies RLS, auth, and data protection",
  },
  forms: {
    icon: FileText,
    label: "Form Validation",
    description: "Ensures proper input validation rules",
  },
};

export function ValidationDisplay({ validation, onApplyFixes, isApplyingFixes }: ValidationDisplayProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pendingFixes, setPendingFixes] = useState<{ category: string; fixes: ValidationFix[] } | null>(null);

  if (!validation) return null;

  const allPassed = 
    validation.navigation.passed && 
    validation.buttons.passed && 
    validation.security.passed && 
    validation.forms.passed;

  const totalIssues = 
    validation.navigation.issues.length + 
    validation.buttons.issues.length + 
    validation.security.issues.length + 
    validation.forms.issues.length;

  const handleRequestFix = (category: string, fixes: ValidationFix[]) => {
    setPendingFixes({ category, fixes });
  };

  const handleConfirmFix = () => {
    if (pendingFixes) {
      onApplyFixes(pendingFixes.fixes, pendingFixes.category);
      setPendingFixes(null);
      toast.success(`Applying fixes for ${pendingFixes.category}...`);
    }
  };

  const handleCancelFix = () => {
    setPendingFixes(null);
  };

  const renderCategory = (key: keyof typeof categoryConfig, data: typeof validation.navigation) => {
    const config = categoryConfig[key];
    const Icon = config.icon;
    const isExpanded = expandedCategory === key;
    const hasFixes = data.fixes.length > 0;

    return (
      <div 
        key={key}
        className={`rounded-lg border ${
          data.passed 
            ? "border-green-500/30 bg-green-500/5" 
            : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        <button
          onClick={() => setExpandedCategory(isExpanded ? null : key)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.passed ? "bg-green-500/20" : "bg-orange-500/20"}`}>
              <Icon className={`h-4 w-4 ${data.passed ? "text-green-500" : "text-orange-500"}`} />
            </div>
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                {config.label}
                {data.passed ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                    {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          {!data.passed && (
            <span className="text-xs text-muted-foreground">
              {isExpanded ? "▲" : "▼"}
            </span>
          )}
        </button>

        {isExpanded && !data.passed && (
          <div className="px-4 pb-4 space-y-3">
            <div className="border-t border-border/50 pt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Issues Found:</h4>
              <ul className="space-y-1">
                {data.issues.map((issue, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <X className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {hasFixes && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRequestFix(key, data.fixes)}
                  className="w-full border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Auto-fix {data.fixes.length} issue{data.fixes.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`rounded-lg p-4 ${
        allPassed 
          ? "border border-green-500/30 bg-green-500/5" 
          : "border border-orange-500/30 bg-orange-500/5"
      }`}>
        <div className="flex items-center gap-3">
          {allPassed ? (
            <>
              <div className="p-2 rounded-full bg-green-500/20">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-green-600">All Checks Passed</h3>
                <p className="text-sm text-muted-foreground">
                  Navigation, buttons, security, and forms are properly configured.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-600">
                  {totalIssues} Issue{totalIssues !== 1 ? 's' : ''} Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Review the issues below and apply fixes to resolve them.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingFixes && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium">Confirm Auto-Fix</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Apply {pendingFixes.fixes.length} fix{pendingFixes.fixes.length !== 1 ? 'es' : ''} for {categoryConfig[pendingFixes.category as keyof typeof categoryConfig]?.label}?
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleConfirmFix}
                  disabled={isApplyingFixes}
                >
                  {isApplyingFixes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Yes, Apply Fixes"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelFix}
                  disabled={isApplyingFixes}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Details */}
      <div className="space-y-2">
        {renderCategory("navigation", validation.navigation)}
        {renderCategory("buttons", validation.buttons)}
        {renderCategory("security", validation.security)}
        {renderCategory("forms", validation.forms)}
      </div>
    </div>
  );
}