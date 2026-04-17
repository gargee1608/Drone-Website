/** Used when global dark mode is re-enabled (ThemeProvider + layout script). */
export const THEME_STORAGE_KEY = "drone-hire-theme";

export type AppTheme = "light" | "dark";

export function readStoredTheme(): AppTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveThemeWithFallback(): AppTheme {
  const stored = readStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
