import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-user-fleet-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-user-fleet-heading",
});

export default function UserDashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      className={`${inter.variable} ${spaceGrotesk.variable} min-h-0 min-w-0 flex flex-1 flex-col bg-[#f8f9fa] text-[#191c1d] antialiased dark:bg-[#111315] dark:text-white`}
      style={{
        fontFamily: "var(--font-user-fleet-body), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
