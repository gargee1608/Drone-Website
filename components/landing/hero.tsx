import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="marketplace"
      className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-slate-50 via-white to-blue-50/90 pt-12 pb-6 sm:pt-14 sm:pb-8 lg:pt-16 lg:pb-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.32fr)] lg:items-center lg:gap-10 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.25rem] lg:leading-[1.2]">
              India’s Drone Pilot Marketplace
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              Connect verified drone pilots with industries. On-demand aerial
              services for agriculture, filming, surveying &amp; more.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/pilot-registration"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-blue-600 bg-blue-600 px-6 text-sm font-semibold whitespace-nowrap text-white shadow-none transition hover:border-blue-700 hover:bg-blue-700 hover:text-white"
            >
              Register a Pilot
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-10 rounded-full border-2 border-blue-600 bg-transparent px-6 text-sm font-semibold text-blue-700 shadow-none transition hover:bg-blue-50/70 hover:text-blue-900"
            >
              Post a Project
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/hero-drone-platform.png"
              alt="Professional black delivery drone in flight carrying a cargo package"
              fill
              className="object-contain object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
