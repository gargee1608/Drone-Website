"use client";

import { useEffect } from "react";
import { LoginView } from "@/components/login/login-view";
import {
  initPilotLoginLanguageFromStorage,
  usePilotLoginLanguage,
} from "@/lib/pilot-login-i18n";

export function AdminLoginView() {
  const year = new Date().getFullYear();
  const { copy } = usePilotLoginLanguage();

  // Force light mode for admin login page
  useEffect(() => {
    initPilotLoginLanguageFromStorage();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    return () => {
      document.documentElement.classList.remove("light");
    };
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <LoginView adminOnly usePilotLoginTranslations />
      <footer className="shrink-0 px-4 pb-6 pt-2 text-center sm:px-6 sm:pb-8">
        <p className="text-xs text-slate-500">{copy.copyright(year)}</p>
      </footer>
    </div>
  );
}
