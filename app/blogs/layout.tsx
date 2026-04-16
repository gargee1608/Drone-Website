import type { ReactNode } from "react";

/** Global `LandingHeader` / `LandingFooter` (same as Marketplace) wrap this route via root layout. */
export default function BlogsLayout({ children }: { children: ReactNode }) {
  return children;
}
