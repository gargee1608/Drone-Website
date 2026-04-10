import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { IndustryUseCases } from "@/components/landing/industry-use-cases";
import { Workflow } from "@/components/landing/workflow";

export default function Home() {
  return (
    <>
      <Header
        ctaLabel="Register a Pilot"
        ctaHref="/pilot-registration"
        showNotifications={false}
      />
      <main className="flex-1">
        <Hero />
        <Features />
        <Workflow />
        <IndustryUseCases />
      </main>
      <Footer />
    </>
  );
}
