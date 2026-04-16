import { Inter, Space_Grotesk } from "next/font/google";

export const spaceGroteskLanding = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-landing-display",
  display: "swap",
});

export const interLanding = Inter({
  subsets: ["latin"],
  variable: "--font-landing-sans",
  display: "swap",
});

export const landingFontVariables = `${spaceGroteskLanding.variable} ${interLanding.variable}`;
