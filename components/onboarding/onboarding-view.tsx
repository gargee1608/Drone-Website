"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  LineChart,
  MapPin,
  Navigation2,
  Package,
  Rocket,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const priorityOptions = [
  { value: "standard", label: "Standard (2-4 hours)" },
  { value: "expedited", label: "Expedited (Under 1 hour)" },
  { value: "emergency", label: "Emergency (Immediate Dispatch)" },
] as const;

const STEPS = [
  {
    key: "mission",
    title: "Mission Setup",
    description: "",
    icon: Rocket,
  },
  {
    key: "payload",
    title: "Payload Details",
    description: "Specify weight and cargo parameters.",
    icon: Package,
  },
  {
    key: "route",
    title: "Route Planning",
    description: "Review path, distance, and corridor.",
    icon: Navigation2,
  },
  {
    key: "summary",
    title: "Summary & Confirmation",
    description: "Verify manifest and confirm launch.",
    icon: ClipboardList,
  },
] as const;

const mapImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCCgQHkSffSTTHuSq_cngCb6tRFw3y83poFh5TIAYIl8MtfsX5MvpR82KHX2mITwQzdVWIjpxUAuTaEE_4ax3iylZ5tC1OjM2-Hix7gJdR6Q07qGDSi5sgKDGIagn6rqc5-GytEcnFP9U0kYSPM_rHwvwjiwgpCCNQTXPFbUchowxdwjr43qam2_55g5naTI1vfWYGhb8FuFj5CuDEbOm8k_kkXz7BWa6fs2zn8c0r6ebXUAj-KnQo4kMjmY0G7XEHizgoHJd6brDaM";

export function OnboardingView() {
  const [stepIndex, setStepIndex] = useState(0);
  const [missionName, setMissionName] = useState("Urban corridor — Sector 7G");
  const [packageKg, setPackageKg] = useState(12.5);
  const [priority, setPriority] =
    useState<(typeof priorityOptions)[number]["value"]>("expedited");

  const totalSteps = STEPS.length;
  const current = STEPS[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="selection:bg-blue-100 selection:text-[#007AFF] dark:selection:bg-blue-950 dark:selection:text-blue-200 flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <div className="shrink-0 pl-3 pt-2 sm:pl-4 sm:pt-4 lg:pl-5">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to home
        </Link>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        {/* Step timeline — point-to-point: Mission → Payload → Route → Summary */}
        <div className="mx-auto mb-10 w-full">
          <div className="mb-6 flex items-start justify-between gap-4 sm:gap-6">
            <div className="min-w-0 text-left">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#191c1d] sm:text-3xl">
                Onboarding Wizards
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Step {String(stepIndex + 1).padStart(2, "0")} of{" "}
                {String(totalSteps).padStart(2, "0")}
              </span>
              {current.description ? (
                <p className="mt-1 text-sm text-slate-500">{current.description}</p>
              ) : null}
            </div>
            <div className="shrink-0 pt-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Progress
              </span>
              <div className="text-xl font-bold text-blue-600">{progressPct}%</div>
            </div>
          </div>

          <div
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6"
            role="navigation"
            aria-label="Wizard steps"
          >
            {/* Horizontal point-to-point timeline (sm+); stacked list on small screens */}
            <ol className="hidden w-full list-none items-center sm:flex">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < stepIndex;
                const active = i === stepIndex;
                const upcoming = i > stepIndex;
                return (
                  <li key={s.key} className="contents">
                    {i > 0 ? (
                      <div
                        className={cn(
                          "h-0.5 min-w-[0.75rem] flex-1 self-center rounded-full transition-colors",
                          i <= stepIndex ? "bg-blue-600" : "bg-slate-200"
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <div className="flex max-w-[22%] min-w-0 flex-1 flex-col items-center px-1 text-center">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                          done &&
                            "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25",
                          active &&
                            "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100",
                          upcoming && "border-slate-200 bg-slate-50 text-slate-400"
                        )}
                      >
                        {done ? (
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        ) : (
                          <Icon className="size-4" aria-hidden />
                        )}
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-[10px] font-bold uppercase tracking-widest",
                          active ? "text-blue-600" : "text-slate-400"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] font-bold leading-tight md:text-xs",
                          active ? "text-slate-900" : "text-slate-600"
                        )}
                      >
                        {s.title}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <ol className="flex flex-col gap-3 sm:hidden">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < stepIndex;
                const active = i === stepIndex;
                const upcoming = i > stepIndex;
                return (
                  <li
                    key={s.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                        done &&
                          "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25",
                        active &&
                          "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100",
                        upcoming && "border-slate-200 bg-slate-50 text-slate-400"
                      )}
                    >
                      {done ? (
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Icon className="size-4" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          active ? "text-blue-600" : "text-slate-400"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")} · {s.title}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-4 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-200">
            {STEPS.map((_, i) => (
              <div
                key={STEPS[i].key}
                className={cn(
                  "h-full min-h-[4px] flex-1 rounded-full transition-colors duration-300",
                  i <= stepIndex ? "bg-blue-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto w-full">
          <section
            className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            aria-labelledby="onboarding-step-title"
          >
            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.05]">
              <LineChart className="size-16 text-blue-700" aria-hidden />
            </div>

            <div className="mb-8 border-b border-slate-100 pb-6">
              <h2 id="onboarding-step-title" className="text-lg font-bold text-slate-900">
                {current.title}
              </h2>
            </div>

            <form
              className="space-y-10"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLast) setStepIndex((n) => Math.min(n + 1, totalSteps - 1));
              }}
            >
              {stepIndex === 0 && (
                <div className="space-y-8">
                  <div>
                    <label
                      htmlFor="mission-name"
                      className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                    >
                      Mission name
                    </label>
                    <input
                      id="mission-name"
                      type="text"
                      value={missionName}
                      onChange={(e) => setMissionName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. Medical supply — Downtown hub"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="priority"
                      className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                    >
                      Priority level
                    </label>
                    <div className="relative">
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) =>
                          setPriority(
                            e.target.value as (typeof priorityOptions)[number]["value"]
                          )
                        }
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 1 && (
                <div className="space-y-8">
                  <div>
                    <label
                      className="mb-6 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                      htmlFor="weight-slider"
                    >
                      Package weight
                    </label>
                    <div className="space-y-6">
                      <div>
                        <div className="mb-4 flex justify-between">
                          <span className="text-sm font-semibold text-slate-700">
                            Cargo load
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {packageKg.toFixed(1)} KG
                          </span>
                        </div>
                        <input
                          id="weight-slider"
                          type="range"
                          min={0}
                          max={50}
                          step={0.5}
                          value={packageKg}
                          onChange={(e) =>
                            setPackageKg(Number.parseFloat(e.target.value))
                          }
                          className="onboarding-slider h-1.5 w-full cursor-pointer rounded-lg bg-slate-100 accent-blue-600"
                        />
                        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-slate-400">
                          <span>Light (0kg)</span>
                          <span>Heavy (50kg)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 2 && (
                <div className="space-y-8">
                  <div>
                    <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      Travel distance
                    </label>
                    <div className="relative">
                      <input
                        readOnly
                        type="text"
                        value="45.2 KM"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        aria-label="Estimated travel distance"
                      />
                      <Navigation2
                        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      Route preview
                    </label>
                    <div className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200">
                      <Image
                        src={mapImageUrl}
                        alt=""
                        fill
                        className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 58vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="rounded border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase text-blue-700 shadow-sm backdrop-blur-md">
                          Vector optimized
                        </div>
                        <div className="rounded border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase text-emerald-600 shadow-sm backdrop-blur-md">
                          Clear skyway
                        </div>
                      </div>
                      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                        <MapPin className="size-10 text-blue-600" aria-hidden />
                        <span className="mt-2 rounded border border-slate-100 bg-white p-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-800 shadow-lg">
                          Target: Sector 7G
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 3 && (
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Review your mission details below. When everything looks correct,
                    confirm to add this flight to the queue.
                  </p>
                  <ul className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                    <li className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
                      <span className="text-slate-500">Mission</span>
                      <span className="max-w-[60%] text-right font-semibold text-slate-900">
                        {missionName || "—"}
                      </span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
                      <span className="text-slate-500">Priority</span>
                      <span className="font-semibold text-slate-900">
                        {
                          priorityOptions.find((p) => p.value === priority)
                            ?.label
                        }
                      </span>
                    </li>
                    <li className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
                      <span className="text-slate-500">Payload</span>
                      <span className="font-semibold text-blue-600">
                        {packageKg.toFixed(1)} kg
                      </span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="text-slate-500">Route</span>
                      <span className="font-semibold text-slate-900">
                        45.2 km · Sector 7G
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => setStepIndex((n) => Math.max(0, n - 1))}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest text-black transition-colors",
                    isFirst && "cursor-not-allowed"
                  )}
                >
                  Previous step
                </button>
                {!isLast ? (
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30 sm:px-10"
                  >
                    Next step
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30 sm:px-10"
                  >
                    Confirm mission
                    <Check className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
