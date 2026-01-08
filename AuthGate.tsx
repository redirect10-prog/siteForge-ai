import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
  showLoginButton?: boolean;
}

export function AuthGate({ 
  children, 
  fallback, 
  message = "Sign in to unlock this feature",
  showLoginButton = true 
}: AuthGateProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-border/50 bg-secondary/20 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {showLoginButton && (
          <Button 
            variant="gradient" 
            size="sm" 
            onClick={() => navigate("/auth")}
            className="relative z-10"
          >
            <span className="relative z-10 flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </span>
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Hook to check if user is authenticated
export function useAuthRequired() {
  const { user, isLoading } = useAuth();
  return { isAuthenticated: !!user, isLoading };
}
