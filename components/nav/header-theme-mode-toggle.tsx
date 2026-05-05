"use client";

import { Moon, Sun } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAppTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function HeaderThemeModeToggle() {
  const { theme, setTheme } = useAppTheme();

  const select = (next: typeof theme) => {
    setTheme(next);
  };

  const segmentBtn =
    "size-8 rounded-md text-muted-foreground hover:text-[#008B8B] dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white";

  const segmentActive =
    "bg-card text-[#008B8B] shadow-sm hover:bg-card hover:text-[#008B8B] dark:bg-white/20 dark:text-white dark:hover:bg-white/25 dark:hover:text-white";

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5 dark:border-white/25 dark:bg-white/10"
      role="group"
      aria-label="Color mode"
    >
      <button
        type="button"
        onClick={() => select("light")}
        aria-pressed={theme === "light"}
        aria-label="Light mode"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          segmentBtn,
          theme === "light" && segmentActive
        )}
      >
        <Sun className="size-4" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => select("dark")}
        aria-pressed={theme === "dark"}
        aria-label="Dark mode"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          segmentBtn,
          theme === "dark" && segmentActive
        )}
      >
        <Moon className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
