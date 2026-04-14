import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { ConditionalSiteFooter } from "@/components/nav/conditional-site-footer";
import { SiteHeader } from "@/components/nav/site-header";

export const metadata: Metadata = {
  title: "AEROLAMINAR — Smart Drone Logistics & Delivery",
  description:
    "Precision AI routing, heavy-lift hardware, and real-time telemetry for autonomous cargo delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="m-0 flex min-h-dvh flex-col gap-0 p-0 font-sans">
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
