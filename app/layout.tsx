import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/app-providers";
import { ConditionalSiteFooter } from "@/components/nav/conditional-site-footer";
import { ConditionalSiteHeader } from "@/components/nav/conditional-site-header";
import { THEME_INIT_INLINE_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  applicationName: "Hire A Drone",
  title: "Hire A Drone — Book Verified Drone Pilot Near You",
  description:
    "Find and hire DGCA-approved drone pilots for defence, agriculture, filming, lifting & everyday drone service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="min-h-dvh overflow-x-clip bg-background antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_INLINE_SCRIPT }}
        />
      </head>
      <body className="m-0 flex min-h-dvh flex-col gap-0 overflow-x-clip bg-background p-0 font-sans text-foreground">
        <AppProviders>
          <ConditionalSiteHeader />
          <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-background">
            {children}
          </main>
          <ConditionalSiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
