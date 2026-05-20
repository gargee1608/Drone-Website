import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Battery, Gauge, ShieldCheck } from "lucide-react";

import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

export function Hero() {
  return (
    <section className="relative flex min-h-[min(820px,90svh)] flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-white via-[#f5fbfb] to-white px-4 pt-8 pb-16 sm:px-8 lg:pt-12">
      <div
        className="pointer-events-none absolute -left-28 top-24 size-80 rounded-full bg-[#008B8B]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-16 size-96 rounded-full bg-[#0D9488]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="rounded-3xl border border-[#008B8B]/10 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#008B8B]/20 bg-white px-4 py-2 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold uppercase tracking-[0.22em] text-[#008B8B] shadow-sm">
            <ShieldCheck className="size-4" aria-hidden />
            Verified drone network
          </div>
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>
            Book Verified Drone Pilot Near You &amp; Connect verified drone
            pilots with industries.
          </h1>
          <p className="mt-6 max-w-lg font-[family-name:var(--font-landing-body)] text-lg leading-relaxed text-muted-foreground md:text-xl">
            Find and hire DGCA-approved drone pilots for defence, agriculture,
            filming, lifting &amp; everyday drone service.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center sm:text-left">
            {["DGCA-ready", "Fast matching", "Secure bookings"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-[#008B8B]/10 bg-white/75 px-3 py-3 text-xs font-bold text-slate-700 shadow-sm"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/matching-hub"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008B8B] px-8 py-4 font-[family-name:var(--font-landing-headline)] text-sm font-black text-white shadow-[0_14px_35px_rgba(0,139,139,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#007474] hover:shadow-[0_18px_45px_rgba(0,139,139,0.32)]"
            >
              Find a Pilot
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/pilot-registration"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[#008B8B] bg-white/70 px-8 py-4 font-[family-name:var(--font-landing-headline)] text-sm font-bold text-[#008B8B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006b6b] hover:bg-white hover:text-[#006b6b]"
            >
              New Registration
            </Link>
          </div>
        </div>

        <div className="group relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-[#008B8B]/15 opacity-60 blur-3xl transition-opacity group-hover:opacity-90" />
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white p-2 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
              <Image
                src="/drone-hero1.png"
                alt="Heavy-lift industrial drone carrying cargo"
                fill
                className="rounded-[1.5rem] object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-2 rounded-[1.5rem] bg-gradient-to-t from-slate-950/20 via-transparent to-transparent"
                aria-hidden
              />
            </div>
            <div className="-mt-8 flex flex-wrap justify-center gap-4 px-4">
              <div className="landing-glass-card relative flex items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                  <Gauge className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Altitude
                  </div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-sm text-foreground">
                    124m
                  </div>
                </div>
              </div>
              <div className="landing-glass-card relative flex items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                  <Battery className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Charge
                  </div>
                  <div className="font-[family-name:var(--font-landing-headline)] text-sm text-foreground">
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
