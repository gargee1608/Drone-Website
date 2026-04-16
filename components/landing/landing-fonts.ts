import { Inter, Space_Grotesk } from "next/font/google";

export const landingBody = Inter({
  subsets: ["latin"],
  variable: "--font-landing-body",
  display: "swap",
});

export const landingHeadline = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-landing-headline",
  display: "swap",
});

export const landingFontClassName = `${landingBody.variable} ${landingHeadline.variable}`;
