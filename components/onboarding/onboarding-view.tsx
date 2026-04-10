"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LineChart,
  MapPin,
  Navigation2,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/landing/header";
import { cn } from "@/lib/utils";

const priorityOptions = [
  { value: "standard", label: "Standard (2-4 hours)" },
  { value: "expedited", label: "Expedited (Under 1 hour)" },
  { value: "emergency", label: "Emergency (Immediate Dispatch)" },
] as const;

const mapImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCCgQHkSffSTTHuSq_cngCb6tRFw3y83poFh5TIAYIl8MtfsX5MvpR82KHX2mITwQzdVWIjpxUAuTaEE_4ax3iylZ5tC1OjM2-Hix7gJdR6Q07qGDSi5sgKDGIagn6rqc5-GytEcnFP9U0kYSPM_rHwvwjiwgpCCNQTXPFbUchowxdwjr43qam2_55g5naTI1vfWYGhb8FuFj5CuDEbOm8k_kkXz7BWa6fs2zn8c0r6ebXUAj-KnQo4kMjmY0G7XEHizgoHJd6brDaM";

export function OnboardingView() {
  const [packageKg, setPackageKg] = useState(12.5);
  const [priority, setPriority] =
    useState<(typeof priorityOptions)[number]["value"]>("expedited");

  return (
    <div className="telemetry-grid-dots selection:bg-blue-100 selection:text-[#007AFF] min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-2 sm:px-8 sm:pt-4 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 pl-0 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 -ml-6 sm:-ml-12 lg:-ml-16"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to home
        </Link>
        <div className="mb-12">
          <div className="mb-4 flex items-end justify-between gap-4 px-2">
            <div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600"
                )}
              >
                Step 02 of 04
              </span>
              <h1
                className={cn(
                  "mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                )}
              >
                Flight Logistics Configuration
              </h1>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400"
                )}
              >
                Progress
              </span>
              <div
                className={cn(
                  "text-xl font-bold text-blue-600"
                )}
              >
                50%
              </div>
            </div>
          </div>
          <div className="flex h-1 w-full gap-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full flex-1 bg-blue-600" />
            <div className="h-full flex-1 bg-blue-600" />
            <div className="h-full flex-1 bg-slate-200" />
            <div className="h-full flex-1 bg-slate-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-sm lg:col-span-7">
            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.05]">
              <LineChart className="size-16 text-blue-700" aria-hidden />
            </div>

            <form className="space-y-10">
              <div className="space-y-8">
                <div>
                  <label
                    className={cn(
                      "mb-6 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                    )}
                  >
                    01. Payload Specifications
                  </label>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-4 flex justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          Package Weight
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold text-blue-600"
                          )}
                        >
                          {packageKg.toFixed(1)} KG
                        </span>
                      </div>
                      <input
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

                <div>
                  <label
                    className={cn(
                      "mb-6 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                    )}
                  >
                    02. Operational Parameters
                  </label>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-tight text-slate-500">
                        Travel Distance
                      </span>
                      <div className="relative">
                        <input
                          readOnly
                          type="text"
                          value="45.2 KM"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <Navigation2
                          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                          aria-hidden
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-tight text-slate-500">
                        Priority Level
                      </span>
                      <div className="relative">
                        <select
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
                </div>

                <div>
                  <label
                    className={cn(
                      "mb-6 block text-[10px] font-bold uppercase tracking-widest text-blue-600"
                    )}
                  >
                    03. Route Selection
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
                        Vector Optimized
                      </div>
                      <div className="rounded border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase text-emerald-600 shadow-sm backdrop-blur-md">
                        Clear Skyway
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                      <MapPin className="size-10 text-blue-600" aria-hidden />
                      <span
                        className={cn(
                          "mt-2 rounded border border-slate-100 bg-white p-1.5 text-[10px] font-bold uppercase tracking-tighter text-slate-800 shadow-lg"
                        )}
                      >
                        Target: Sector 7G
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
                  )}
                >
                  Previous Step
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30 sm:px-10"
                  )}
                >
                  Initialize Flight
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-xl border-l-4 border-blue-600 bg-slate-50 p-6 shadow-sm">
              <h3
                className={cn(
                  "mb-6 text-xs font-bold uppercase tracking-widest text-slate-500"
                )}
              >
                Manifest Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-xs font-medium text-slate-500">
                    User Profile
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    Capt. James Holden
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-xs font-medium text-slate-500">
                    Fleet Designation
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    Aero-Cargoline #402
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-xs font-medium text-slate-500">
                    Est. Flight Duration
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    22m 14s
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs font-medium text-slate-500">
                    Credits Required
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold text-blue-700"
                    )}
                  >
                    1,420.00
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded bg-blue-50 p-2 text-blue-600">
                  <Zap className="size-5" aria-hidden />
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">
                    Optimized Pathing
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Our AI has calculated a route that avoids urban noise
                    ordinances while prioritizing signal stability.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className={cn(
                  "mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                )}
              >
                Atmospheric Data
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    Wind Speed
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold text-slate-900"
                    )}
                  >
                    12 knots
                  </span>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    Visibility
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold text-emerald-600"
                    )}
                  >
                    Optimal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-100 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 md:flex-row">
          <div
            className={cn(
              "text-base font-bold uppercase tracking-tight text-blue-700"
            )}
          >
            AEROLAMINAR Logistics
          </div>
          <nav
            className="flex flex-nowrap items-center justify-center gap-x-2 text-slate-500 sm:gap-x-4 md:gap-x-6 lg:gap-8"
            aria-label="Legal and support"
          >
            {["Privacy Policy", "Terms of Service", "API Docs", "Contact Support"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="shrink-0 cursor-pointer whitespace-nowrap text-xs transition-opacity hover:text-blue-600 sm:text-sm"
                >
                  {label}
                </a>
              )
            )}
          </nav>
          <div className="text-sm text-slate-400">
            © 2024 AEROLAMINAR Logistics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
