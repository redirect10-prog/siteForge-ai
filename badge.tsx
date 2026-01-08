import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline:
          "text-foreground border-border",
        gradient:
          "border-transparent text-primary-foreground bg-gradient-to-r from-primary to-accent shadow-sm",
        glow:
          "border-primary/30 bg-primary/10 text-primary shadow-sm shadow-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const tierStyles = {
  free: "border-muted-foreground/30 bg-muted text-muted-foreground",
  pro: "border-primary/30 bg-primary/10 text-primary",
  business: "border-accent/30 bg-accent/10 text-accent",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tier?: 'free' | 'pro' | 'business';
}

function Badge({ className, variant, tier, ...props }: BadgeProps) {
  const tierClassName = tier ? tierStyles[tier] : "";

  return (
    <div 
      className={cn(badgeVariants({ variant }), tierClassName, className)} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
