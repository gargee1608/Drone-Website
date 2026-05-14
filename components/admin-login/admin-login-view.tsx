"use client";

import { useEffect } from "react";
import { LoginView } from "@/components/login/login-view";

export function AdminLoginView() {
  // Force light mode for admin login page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    return () => {
      document.documentElement.classList.remove('light');
    };
  }, []);

  return <LoginView adminOnly />;
}
