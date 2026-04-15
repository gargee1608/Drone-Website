import type { Metadata } from "next";
// import Script from "next/script";
import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { ConditionalSiteFooter } from "@/components/nav/conditional-site-footer";
import { SiteHeader } from "@/components/nav/site-header";
// import { THEME_STORAGE_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Drone Hire — Smart Drone Logistics & Delivery",
  description:
    "Precision AI routing, heavy-lift hardware, and real-time telemetry for autonomous cargo delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Dark mode: beforeInteractive theme script disabled — uncomment + ThemeProvider to re-enable. */
  // const themeInit = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark")document.documentElement.classList.add("dark");else if(t==="light")document.documentElement.classList.remove("dark");else if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark");}catch(e){}})();`;

  return (
    <html lang="en" className="min-h-dvh overflow-x-clip antialiased">
      <body className="m-0 flex min-h-dvh flex-col gap-0 overflow-x-clip bg-background p-0 font-sans text-foreground">
        {/*
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInit }}
        />
        */}
        <AppProviders>
          <SiteHeader />
          <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            {children}
          </main>
          <ConditionalSiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
