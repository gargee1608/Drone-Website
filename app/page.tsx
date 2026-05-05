import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import { LandingSectionDivider } from "@/components/landing/landing-section-divider";
import { Workflow } from "@/components/landing/workflow";

export default function Home() {
  return (
    <div
      className={`${landingFontClassName} min-h-dvh bg-background font-[family-name:var(--font-landing-body)] text-foreground antialiased`}
    >
      <main className="overflow-x-hidden bg-background pt-24">
        <Hero />
        <LandingSectionDivider />
        <Workflow />
        <LandingSectionDivider />
        <Features />
      </main>
    </div>
  );
}
