"use client";

/**
 * Syncs `html.dark` with stored preference and exposes `useAppTheme()` for the
 * header toggle and any client-only theme UI.
 */

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  applyThemeToDocument,
  resolveThemeWithFallback,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Marketing pages that should always be light mode
const MARKETING_PAGES = ["/", "/blogs", "/services", "/contact"];

function isMarketingPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return MARKETING_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<AppTheme>("light");

  useLayoutEffect(() => {
    // Force light mode for marketing pages
    if (isMarketingPage(pathname)) {
      setThemeState("light");
      applyThemeToDocument("light");
      return;
    }

    // Use stored theme for dashboards
    const initial = resolveThemeWithFallback();
    setThemeState(initial);
    applyThemeToDocument(initial);
  }, [pathname]);

  const setTheme = useCallback((next: AppTheme) => {
    // Don't allow theme changes on marketing pages
    if (isMarketingPage(pathname)) {
      return;
    }

    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyThemeToDocument(next);
  }, [pathname]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return ctx;
}
