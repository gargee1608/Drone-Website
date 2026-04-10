import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
