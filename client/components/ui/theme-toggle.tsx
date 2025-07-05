import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-9 rounded-md transition-all duration-300",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun
        className={cn(
          "h-4 w-4 rotate-0 scale-100 transition-all duration-300",
          theme === "dark" && "-rotate-90 scale-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300",
          theme === "dark" && "rotate-0 scale-100",
        )}
      />
    </Button>
  );
}
