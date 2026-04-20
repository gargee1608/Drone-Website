"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  Navigation2,
  Star,
  Timer,
} from "lucide-react";

import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";

function readSnapshot(): PilotProfileSnapshot | null {
  if (typeof window === "undefined") return null;
  /* Prefer session (just submitted); fall back to local (persisted). */
  const raw =
    sessionStorage.getItem(PILOT_PROFILE_STORAGE_KEY) ??
    localStorage.getItem(PILOT_PROFILE_STORAGE_KEY);
  return parsePilotProfileSnapshot(raw);
}

function maskAadhaar(digits: string | undefined) {
  const clean = (digits ?? "").replace(/\D/g, "");
  if (clean.length < 4) return "—";
  return `****${clean.slice(-4)}`;
}

export type PilotProfileViewVariant = "standalone" | "dashboard";

export function PilotProfileView({
  variant = "standalone",
}: {
  variant?: PilotProfileViewVariant;
} = {}) {
  const router = useRouter();
  const [data, setData] = useState<PilotProfileSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const snap = readSnapshot();
    setData(snap);
    setReady(true);
    if (variant === "standalone" && !snap) {
      router.replace("/");
    } else if (snap) {
      window.scrollTo(0, 0);
    }
  }, [router, variant]);

  if (!ready) {
    return (
      <div
        className={
          variant === "dashboard"
            ? "flex min-h-[12rem] items-center justify-center bg-white text-xs text-slate-600"
            : "flex min-h-dvh items-center justify-center bg-white text-xs text-slate-600"
        }
      >
        Loading…
      </div>
    );
  }

  if (!data) {
    if (variant === "dashboard") {
      return (
        <div className="relative bg-white pb-8 pt-1 text-slate-900">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to dashboard
          </Link>
          <div className="mx-auto max-w-5xl">
            <h1 className="text-xl font-bold text-slate-900">Profile</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              No pilot profile is saved in this browser yet. Complete pilot
              registration to see details here.
            </p>
            <Link
              href="/pilot-registration"
              className="mt-5 inline-flex items-center justify-center rounded-full border-2 border-blue-600 bg-white px-5 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
            >
              Register a pilot
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-xs text-slate-600">
        Loading…
      </div>
    );
  }

  const initial = data.fullName.trim().charAt(0).toUpperCase() || "P";
  const location =
    [data.city.trim(), data.state].filter(Boolean).join(", ") || "—";
  const showDgcaBadge = Boolean(data.dgca.trim());

  const backHref = variant === "dashboard" ? "/dashboard" : "/";
  const backLabel =
    variant === "dashboard" ? "Back to dashboard" : "Back to home";
  const backLinkClass =
    variant === "dashboard"
      ? "mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
      : "fixed left-4 top-4 z-10 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 sm:left-6 sm:top-6";

  return (
    <div
      className={
        variant === "dashboard"
          ? "relative bg-white text-slate-900"
          : "relative min-h-dvh bg-white text-slate-900"
      }
    >
      <Link href={backHref} className={backLinkClass}>
        <ArrowLeft className="size-3.5" aria-hidden />
        {backLabel}
      </Link>

      <div
        className={
          variant === "dashboard"
            ? "mx-auto max-w-5xl px-0 pb-8 pt-0 sm:px-0"
            : "mx-auto max-w-5xl px-3 pb-12 pt-9 sm:px-5 sm:pt-11"
        }
      >
        <header className="flex flex-col items-center text-center">
          <div
            className="flex size-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-md"
            aria-hidden
          >
            {initial}
          </div>
          <h1 className="mt-3 text-lg font-bold text-slate-900">
            {data.fullName.trim() || "Pilot"}
          </h1>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="text-sky-700/90">{location}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-slate-400" aria-hidden />
              <span className="font-medium text-slate-800">
                {data.flightHours}h flown
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Star
                className="size-3.5 fill-amber-400 text-amber-400"
                aria-hidden
              />
              <span className="font-medium text-slate-800">
                4.8 <span className="text-slate-500">(New)</span>
              </span>
            </span>
          </div>
          {showDgcaBadge ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
              <span
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-[9px] text-slate-600"
                aria-hidden
              >
                ✓
              </span>
              DGCA Verified
            </div>
          ) : null}
        </header>

        <div className="mt-8 grid gap-3 sm:gap-4 lg:grid-cols-2 lg:items-start">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900">About</h2>
            <dl className="space-y-2 border-b border-slate-100 pb-3 text-xs">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">Email</dt>
                <dd className="min-w-0 break-all text-slate-800 sm:text-right sm:flex-1">
                  {data.email?.trim() ? (
                    <a
                      href={`mailto:${data.email.trim()}`}
                      className="text-blue-600 underline-offset-2 hover:underline"
                    >
                      {data.email.trim()}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">Phone</dt>
                <dd className="min-w-0 break-all text-slate-800 sm:text-right sm:flex-1">
                  {data.phone?.trim() ? (
                    <a
                      href={`tel:${data.phone.replace(/\s/g, "")}`}
                      className="text-blue-600 underline-offset-2 hover:underline"
                    >
                      {data.phone.trim()}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">City</dt>
                <dd className="min-w-0 text-slate-800 sm:text-right sm:flex-1">
                  {data.city.trim() || "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">State</dt>
                <dd className="min-w-0 text-slate-800 sm:text-right sm:flex-1">
                  {data.state.trim() || "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">Aadhaar</dt>
                <dd className="font-mono text-xs text-slate-800 sm:text-right sm:flex-1">
                  {maskAadhaar(data.aadhaar)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 font-medium text-slate-500">
                  DGCA license
                </dt>
                <dd className="min-w-0 break-all font-mono text-xs text-slate-800 sm:text-right sm:flex-1">
                  {data.dgca.trim() || "—"}
                </dd>
              </div>
            </dl>
            <div className="pt-3">
              <h3 className="mb-1.5 text-xs font-semibold text-slate-800">
                Brief bio
              </h3>
              <p className="min-w-0 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
                {data.bio.trim() || "—"}
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:gap-4">
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.length > 0 ? (
                  data.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <h2 className="mb-2 text-sm font-bold text-slate-900">
                Drone ({data.drones.length})
              </h2>
              {data.drones.length === 0 ? (
                <p className="text-xs text-slate-500">No drones added.</p>
              ) : (
                <ul className="space-y-2">
                  {data.drones.map((d) => {
                    const title =
                      d.modelName.trim().split(/\s+/)[0] || d.modelName;
                    const tag = d.useCases[0] ?? d.type;
                    const cam = d.camera.trim() || "—";
                    const mins = d.flightTimeMin.trim() || "—";
                    const km = d.rangeKm.trim() || "—";
                    return (
                      <li
                        key={d.id}
                        className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 break-words text-sm font-bold text-slate-900">
                            {title}
                          </p>
                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {tag}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="size-3.5 text-slate-400" />
                            {cam}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Timer className="size-3.5 text-slate-400" />
                            {mins} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Navigation2 className="size-3.5 text-slate-400" />
                            {km} km
                          </span>
                        </div>
                        {d.useCases.length > 0 ? (
                          <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] font-medium text-slate-600">
                            {d.useCases.map((uc, i) => (
                              <span key={uc}>
                                {i > 0 ? (
                                  <span className="text-slate-300"> · </span>
                                ) : null}
                                {uc}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
