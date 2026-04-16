import Image from "next/image";
import Link from "next/link";
import { Battery, Gauge } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[min(800px,90svh)] flex-col items-center justify-center overflow-hidden bg-white px-4 py-16 sm:px-8">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="flex h-2 w-2 rounded-full bg-[#0d6200] shadow-[0_0_8px_#0d6200]" />
            <span className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
              Autonomous Network Live
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-landing-headline)] text-3xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Smart Drone Logistics &amp; Delivery Platform
          </h1>
          <p className="mt-6 max-w-lg font-[family-name:var(--font-landing-body)] text-lg leading-relaxed text-slate-600 md:text-xl">
            Connect verified drone pilots with industries. On-demand aerial
            services for agriculture, filming, surveying &amp; more.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[#009aa1] px-8 py-4 font-[family-name:var(--font-landing-headline)] text-sm font-black text-white shadow-[0_10px_30px_rgba(0,154,161,0.2)] transition-transform hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              href="/pilot-registration"
              className="inline-flex items-center justify-center rounded-md border-2 border-[#008C8C] bg-transparent px-8 py-4 font-[family-name:var(--font-landing-headline)] text-sm font-bold text-[#008C8C] transition-colors hover:border-[#007070] hover:text-[#007070] hover:bg-transparent"
            >
              Register a Pilot
            </Link>
          </div>
        </div>

        <div className="group relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-[#009aa1]/10 opacity-20 blur-3xl transition-opacity group-hover:opacity-40" />
          <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
              <Image
                src="/hero-drone-platform.png"
                alt="Heavy-lift industrial drone carrying cargo"
                fill
                className="object-contain object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute top-8 right-8 flex flex-col gap-2">
              <div className="landing-glass-card flex items-center gap-4 rounded-lg border border-slate-200 p-3 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded bg-[#0d6200]/10 text-[#0d6200]">
                  <Gauge className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Altitude
                  </div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-sm text-slate-900">
                    124m
                  </div>
                </div>
              </div>
              <div className="landing-glass-card flex items-center gap-4 rounded-lg border border-slate-200 p-3 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded bg-[#009aa1]/10 text-[#009aa1]">
                  <Battery className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Charge
                  </div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-sm text-slate-900">
                    88%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
