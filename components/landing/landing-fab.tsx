import Link from "next/link";
import { Rocket } from "lucide-react";

export function LandingFab() {
  return (
    <Link
      href="/pilot-registration"
      className="group fixed bottom-8 right-8 z-[100] flex size-16 items-center justify-center rounded-full bg-slate-900 shadow-xl transition-transform active:scale-95"
      aria-label="Start Pilot HQ"
      title="Start Pilot HQ"
    >
      <Rocket className="size-8 text-white" strokeWidth={2} aria-hidden />
      <span className="pointer-events-none absolute right-[calc(100%+0.5rem)] whitespace-nowrap rounded-lg bg-slate-900 py-2 px-4 font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
        Start Pilot HQ
      </span>
    </Link>
  );
}
