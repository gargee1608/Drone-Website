import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { IndustryUseCases } from "@/components/landing/industry-use-cases";
import { ScrollZoomRoot } from "@/components/landing/scroll-zoom-sections";
import { Workflow } from "@/components/landing/workflow";

export default function Home() {
  return (
    <ScrollZoomRoot className="flex min-h-0 flex-1 flex-col bg-background">
      <Hero />
      <Features />
      <Workflow />
      <IndustryUseCases />
    </ScrollZoomRoot>
  );
}
