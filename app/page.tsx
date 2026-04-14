import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { IndustryUseCases } from "@/components/landing/industry-use-cases";
import { Workflow } from "@/components/landing/workflow";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Workflow />
      <IndustryUseCases />
    </>
  );
}
