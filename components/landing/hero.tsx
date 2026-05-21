import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Battery, Gauge, Lock, Rocket, ShieldCheck } from "lucide-react";

import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

const heroHighlights = [
  { label: "DGCA-ready", Icon: ShieldCheck },
  { label: "Fast matching", Icon: Rocket },
  { label: "Secure bookings", Icon: Lock },
];

export function Hero() {
  return (
    <section className="relative flex min-h-0 flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-white via-[#f5fbfb] to-white px-3 pt-5 pb-12 sm:min-h-[min(820px,90svh)] sm:px-8 sm:pt-8 sm:pb-16 lg:pt-12">
      <div
        className="pointer-events-none absolute -left-28 top-24 size-80 rounded-full bg-[#008B8B]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-16 size-96 rounded-full bg-[#0D9488]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="rounded-3xl border border-[#008B8B]/10 bg-white/80 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#008B8B]/20 bg-white px-3 py-2 font-[family-name:var(--font-landing-headline)] text-[9px] font-bold uppercase tracking-[0.16em] text-[#008B8B] shadow-sm sm:px-4 sm:text-[10px] sm:tracking-[0.22em]">
            <ShieldCheck className="size-4" aria-hidden />
            <span className="truncate">Verified drone network</span>
          </div>
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>
            Book Verified Drone Pilot Near You &amp; Connect verified drone
            pilots with industries.
          </h1>
          <p className="mt-4 max-w-lg font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-muted-foreground sm:mt-6 md:text-xl">
            Find and hire DGCA-approved drone pilots for defence, agriculture,
            filming, lifting &amp; everyday drone service.
          </p>
          <div className="mt-6 grid max-w-xl grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:mt-8">
            {heroHighlights.map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#008B8B]/10 bg-white/75 px-3 py-4 text-center text-xs font-bold text-slate-700 shadow-sm"
              >
                <span className="mx-auto flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                  <Icon className="size-5" strokeWidth={2.2} aria-hidden />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-3 min-[420px]:grid-cols-2 sm:mt-10 sm:flex sm:flex-wrap sm:gap-4">
            <Link
              href="/matching-hub"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008B8B] px-6 py-3.5 font-[family-name:var(--font-landing-headline)] text-sm font-black text-white shadow-[0_14px_35px_rgba(0,139,139,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#007474] hover:shadow-[0_18px_45px_rgba(0,139,139,0.32)] sm:px-8 sm:py-4"
            >
              Find a Pilot
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/pilot-registration"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[#008B8B] bg-white/70 px-6 py-3.5 font-[family-name:var(--font-landing-headline)] text-sm font-bold text-[#008B8B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006b6b] hover:bg-white hover:text-[#006b6b] sm:px-8 sm:py-4"
            >
              New Registration
            </Link>
          </div>
        </div>

        <div className="group relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-3 rounded-[2rem] bg-[#008B8B]/15 opacity-60 blur-3xl transition-opacity group-hover:opacity-90 sm:-inset-5 sm:rounded-[2.5rem]" />
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-white/80 bg-white p-1.5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:rounded-[2rem] sm:p-2">
              <Image
                src="/drone-hero1.png"
                alt="Heavy-lift industrial drone carrying cargo"
                fill
                className="rounded-[1.125rem] object-cover object-center sm:rounded-[1.5rem]"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="absolute inset-1.5 rounded-[1.125rem] bg-gradient-to-t from-slate-950/20 via-transparent to-transparent sm:inset-2 sm:rounded-[1.5rem]"
                aria-hidden
              />
            </div>
            <div className="-mt-6 grid grid-cols-2 gap-3 px-3 sm:-mt-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 sm:px-4">
              <div className="landing-glass-card relative flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B] sm:size-11">
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
              <div className="landing-glass-card relative flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B] sm:size-11">
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
