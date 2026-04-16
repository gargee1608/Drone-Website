"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";

export function LandingPilotFab() {
  return (
    <Link
      href="/pilot-registration"
      className="group fixed right-8 bottom-8 z-[100] flex size-16 items-center justify-center rounded-full bg-slate-900 shadow-xl transition active:scale-95"
      aria-label="Start Pilot HQ"
    >
      <Rocket className="size-8 text-white" strokeWidth={1.75} aria-hidden />
      <span className="pointer-events-none absolute right-20 rounded-lg bg-slate-900 py-2 px-4 text-[10px] font-bold tracking-widest text-white uppercase opacity-0 whitespace-nowrap transition-opacity group-hover:opacity-100">
        Start Pilot HQ
      </span>
    </Link>
  );
}
