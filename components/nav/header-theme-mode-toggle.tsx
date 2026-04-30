"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  applyThemeToDocument,
  resolveThemeWithFallback,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export function HeaderThemeModeToggle() {
  const [theme, setTheme] = useState<AppTheme>("light");

  useLayoutEffect(() => {
    const initial = resolveThemeWithFallback();
    setTheme(initial);
    applyThemeToDocument(initial);
  }, []);

  const select = (next: AppTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyThemeToDocument(next);
  };

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
          "size-8 rounded-md text-muted-foreground hover:text-[#008B8B] dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white",
          theme === "light" &&
            "bg-card text-[#008B8B] shadow-sm hover:bg-card hover:text-[#008B8B] dark:bg-white/20 dark:text-white dark:hover:bg-white/25 dark:hover:text-white"
        )}
      >
        <Sun className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => select("dark")}
        aria-pressed={theme === "dark"}
        aria-label="Dark mode"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 rounded-md text-muted-foreground hover:text-[#008B8B] dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white",
          theme === "dark" &&
            "bg-card text-[#008B8B] shadow-sm hover:bg-card hover:text-[#008B8B] dark:bg-white/20 dark:text-white dark:hover:bg-white/25 dark:hover:text-white"
        )}
      >
        <Moon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
