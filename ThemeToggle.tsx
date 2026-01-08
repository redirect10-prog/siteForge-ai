import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // Light mode only - component kept for compatibility but does nothing
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Light mode"
      className="h-9 w-9 cursor-default"
      disabled
    >
      <Sun className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
