import Link from "next/link";
import { ArrowRight, Lock, Rocket, ShieldCheck } from "lucide-react";

import { HeroVisual } from "@/components/landing/hero-visual";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

const heroHighlights = [
  { label: "DGCA-ready", Icon: ShieldCheck },
  { label: "Fast matching", Icon: Rocket },
  { label: "Secure bookings", Icon: Lock },
];

export function Hero() {
  return (
    <section className="relative flex min-h-0 flex-col items-center justify-start overflow-hidden bg-white px-3 pt-5 pb-12 sm:min-h-[min(820px,90svh)] sm:px-8 sm:pt-8 sm:pb-16 lg:pt-12">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="hero-content-enter rounded-3xl border border-[#008B8B]/10 bg-white/80 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
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
          <div className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 sm:mt-10">
            <Link
              href="/matching-hub"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#008B8B] px-5 py-3.5 font-[family-name:var(--font-landing-headline)] text-xs font-black text-white shadow-[0_14px_35px_rgba(0,139,139,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#007474] hover:shadow-[0_18px_45px_rgba(0,139,139,0.32)] sm:px-6 sm:py-4 sm:text-sm lg:px-4 lg:text-xs"
            >
              Find a Pilot
              <ArrowRight className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            </Link>
            <Link
              href="/pilot-registration"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border-2 border-[#008B8B] bg-white/70 px-5 py-3.5 font-[family-name:var(--font-landing-headline)] text-xs font-bold text-[#008B8B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006b6b] hover:bg-white hover:text-[#006b6b] sm:px-6 sm:py-4 sm:text-sm lg:px-4 lg:text-xs"
            >
              New Registration
            </Link>
            <Link
              href="/post-your-requirement"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border-2 border-[#008B8B] bg-white/70 px-5 py-3.5 font-[family-name:var(--font-landing-headline)] text-xs font-bold text-[#008B8B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006b6b] hover:bg-white hover:text-[#006b6b] min-[480px]:col-span-2 lg:col-span-1 sm:px-6 sm:py-4 sm:text-sm lg:px-4 lg:text-xs"
            >
              Post Your Requirement
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
