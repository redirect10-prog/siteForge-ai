import { Sparkles, LayoutGrid, User, LogOut, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  tier: 'free' | 'pro' | 'business';
  requestsUsed: number;
  requestsLimit: number;
}

export function Header({ tier, requestsUsed, requestsLimit }: HeaderProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const tierLabels = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business'
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Site<span className="gradient-text">Forge</span>
            </span>
          </Link>
          
          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"} 
                size="sm"
              >
                Generator
              </Button>
            </Link>
            <Link to="/gallery">
              <Button 
                variant={location.pathname === "/gallery" ? "secondary" : "ghost"} 
                size="sm"
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Gallery
              </Button>
            </Link>
            {user && (
              <Link to="/my-websites">
                <Button 
                  variant={location.pathname === "/my-websites" ? "secondary" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  My Sites
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-muted-foreground">
              {requestsUsed}/{requestsLimit === Infinity ? '∞' : requestsLimit} today
            </span>
            <div className="h-4 w-px bg-border" />
            <Badge tier={tier}>
              {tierLabels[tier]}
            </Badge>
          </div>
          
          <ThemeToggle />
          
          {tier !== 'business' && (
            <Button variant="gradient" size="sm" className="relative z-10">
              <span className="relative z-10">Upgrade</span>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/my-websites" className="cursor-pointer">
                    <Globe className="h-4 w-4 mr-2" />
                    My Websites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
