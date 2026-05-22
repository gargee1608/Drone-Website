"use client";

import Image from "next/image";
import { Battery, Gauge } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

import { heroDroneImg } from "@/components/landing/hero-image-preload";

function useCountUp(
  target: number,
  durationMs: number,
  mode: "idle" | "animate" | "instant",
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (mode === "idle") return;
    if (mode === "instant") {
      setValue(target);
      return;
    }

    setValue(0);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, mode]);

  return value;
}

export function HeroVisual() {
  const [imageOpen, setImageOpen] = useState(false);
  const [countMode, setCountMode] = useState<"idle" | "animate" | "instant">(
    "idle",
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const playReveal = () => {
      if (mq.matches) {
        setImageOpen(true);
        setCountMode("instant");
        return;
      }

      setImageOpen(false);
      setCountMode("animate");

      requestAnimationFrame(() => {
        setImageOpen(true);
      });
    };

    playReveal();
    mq.addEventListener("change", playReveal);
    return () => mq.removeEventListener("change", playReveal);
  }, []);

  const altitude = useCountUp(124, 400, countMode);
  const charge = useCountUp(88, 350, countMode);

  return (
    <div className="group relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        className="hero-visual-glow-enter absolute -inset-3 rounded-[2rem] bg-[#008B8B]/15 opacity-60 blur-3xl transition-opacity group-hover:opacity-90 sm:-inset-5 sm:rounded-[2.5rem]"
        aria-hidden
      />
      <div className="relative">
        <div
          className="hero-visual-frame-enter hero-visual-float"
          data-open={imageOpen ? "true" : "false"}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-white/80 bg-[#e8f4f4] p-1.5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:rounded-[1.75rem] sm:p-2">
            <div className="hero-visual-image-open relative h-full w-full overflow-hidden rounded-[1rem] sm:rounded-[1.5rem]">
              <Image
                id="hero-drone-image"
                src={heroDroneImg}
                alt="FPV pilot operating a heavy-lift drone carrying cargo over mountain terrain"
                fill
                className="rounded-[1rem] object-cover object-center sm:rounded-[1.5rem]"
                priority
                fetchPriority="high"
                quality={75}
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 640px"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[1rem] bg-gradient-to-t from-slate-950/25 via-transparent to-transparent sm:rounded-[1.5rem]"
                aria-hidden
              />
              <div
                className="hero-visual-shine pointer-events-none absolute inset-0 z-[5] rounded-[1rem] sm:rounded-[1.5rem]"
                aria-hidden
              />
            </div>

            <div
              className="hero-visual-shutter hero-visual-shutter-top pointer-events-none absolute inset-x-0 top-0 z-20 h-1/2 origin-bottom rounded-t-[1rem] sm:rounded-t-[1.5rem]"
              aria-hidden
            />
            <div
              className="hero-visual-shutter hero-visual-shutter-bottom pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 origin-top rounded-b-[1rem] sm:rounded-b-[1.5rem]"
              aria-hidden
            />
          </div>
        </div>

        <div className="-mt-6 grid grid-cols-2 gap-3 px-3 sm:-mt-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 sm:px-4">
          <div className="hero-telemetry-enter hero-telemetry-enter-left landing-glass-card relative flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B] sm:size-11">
              <Gauge className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Altitude
              </div>
              <div className="hero-telemetry-value-pulse font-[family-name:var(--font-landing-headline)] text-sm text-foreground tabular-nums">
                {altitude}m
              </div>
            </div>
          </div>
          <div className="hero-telemetry-enter hero-telemetry-enter-right landing-glass-card relative flex min-w-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B] sm:size-11">
              <Battery className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <div className="font-[family-name:var(--font-landing-headline)] text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Charge
              </div>
              <div className="hero-telemetry-value-pulse font-[family-name:var(--font-landing-headline)] text-sm text-foreground tabular-nums">
                {charge}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
