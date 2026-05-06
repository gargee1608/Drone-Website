"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/** Icon-only theme switch for pilot, user, and admin dashboard headers (`useAppTheme` / `html.dark`). */
export function PilotHeaderThemeToggle() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/70 p-0.5"
      role="group"
      aria-label="Color mode"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Light mode"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "size-8 rounded-md",
          theme === "light" && "bg-background text-foreground shadow-sm"
        )}
      >
        <Sun className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "size-8 rounded-md",
          theme === "dark" && "bg-background text-foreground shadow-sm"
        )}
      >
        <Moon className="size-4" />
      </Button>
    </div>
  );
}
