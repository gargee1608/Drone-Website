"use client";

import { Languages } from "lucide-react";
import { useEffect } from "react";

import {
  initPilotLoginLanguageFromStorage,
  usePilotLoginLanguage,
  type PilotLoginLanguage,
} from "@/lib/pilot-login-i18n";
import { cn } from "@/lib/utils";

type PilotLoginLanguageSelectorProps = {
  className?: string;
  /** Compact layout for mobile drawer */
  variant?: "header" | "drawer";
};

export function PilotLoginLanguageSelector({
  className,
  variant = "header",
}: PilotLoginLanguageSelectorProps) {
  const { language, setLanguage, copy } = usePilotLoginLanguage();

  useEffect(() => {
    initPilotLoginLanguageFromStorage();
  }, []);

  const isDrawer = variant === "drawer";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center",
        isDrawer
          ? "mb-3 w-full gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          : "hidden shrink-0 gap-1.5 rounded-full border border-border bg-card py-1.5 pl-2.5 pr-1.5 dark:border-white/20 dark:bg-white/5 xl:flex",
        className
      )}
    >
      <Languages
        className={cn(
          "shrink-0 text-slate-500 dark:text-white/70",
          isDrawer ? "size-4" : "size-4"
        )}
        aria-hidden
      />
      <label
        htmlFor="pilot-login-language-select"
        className={cn(
          "shrink-0 font-medium text-slate-600 dark:text-white/80",
          isDrawer ? "text-sm" : "sr-only"
        )}
      >
        {copy.language}
      </label>
      <select
        id="pilot-login-language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as PilotLoginLanguage)}
        className={cn(
          "min-w-0 cursor-pointer border-0 bg-transparent font-medium text-slate-900 outline-none focus:ring-0 dark:text-white",
          isDrawer
            ? "flex-1 py-1 text-sm"
            : "max-w-[6.5rem] py-0.5 pr-1 text-xs"
        )}
        aria-label={copy.language}
      >
        <option value="en">{copy.english}</option>
        <option value="hi">{copy.hindi}</option>
      </select>
    </div>
  );
}
