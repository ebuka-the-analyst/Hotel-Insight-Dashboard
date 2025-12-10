import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "w-full justify-start gap-3 hover:bg-sidebar-accent transition-all duration-200 relative",
        collapsed && "justify-center"
      )}
      data-testid="button-theme-toggle"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute left-3 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {!collapsed && (
        <span className="font-medium ml-2">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </Button>
  );
}
