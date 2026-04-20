"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Circle,
  Clock,
  Headset,
  LayoutGrid,
  Mail,
  Pencil,
  Phone,
  Settings,
  Shield,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import {
  normalizePilotSkillsForSnapshot,
  parsePilotProfileSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
  replaceAbcPlaceholder,
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

function parseSkillsManual(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Profile fill score shown as “Mission success” (0–100%, one decimal). */
function missionSuccessPercent(d: PilotProfileSnapshot): number {
  const checks = [
    Boolean(d.email?.trim()),
    Boolean(d.phone?.trim()),
    Boolean(d.city.trim()),
    Boolean(d.state.trim()),
    Boolean(d.bio.trim()),
    Boolean(d.dgca.trim()),
    d.skills.length > 0,
    (d.drones?.length ?? 0) > 0,
  ];
  let n = 0;
  for (const c of checks) if (c) n += 1;
  return Math.min(100, Math.round((n / checks.length) * 1000) / 10);
}

const editTextareaClass =
  "min-h-[88px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export type PilotProfileViewVariant = "standalone" | "dashboard";

type MetricCardProps = {
  icon: ReactNode;
  iconWrapClass: string;
  value: string;
  label: string;
};

function MetricCard({ icon, iconWrapClass, value, label }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div
        className={`flex size-11 items-center justify-center rounded-lg ${iconWrapClass}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-2xl tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

type InfoRowProps = {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: ReactNode;
};

function InfoRow({ icon, iconClass, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4 border-b border-border py-4 last:border-b-0">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
        >
          {label}
        </p>
        <div className="mt-1 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function PilotProfileView({
  variant = "standalone",
}: {
  variant?: PilotProfileViewVariant;
} = {}) {
  const router = useRouter();
  const [data, setData] = useState<PilotProfileSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStateField, setEditStateField] = useState("");
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editDgca, setEditDgca] = useState("");
  const [editFlightHours, setEditFlightHours] = useState(0);
  const [editSkillsText, setEditSkillsText] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const refreshFromStorage = useCallback(() => {
    setData(readSnapshot());
  }, []);

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

  useEffect(() => {
    const onUpdated = () => refreshFromStorage();
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, onUpdated);
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen]);

  function openEditDialog() {
    const snap = readSnapshot();
    if (!snap) return;
    setEditFullName(snap.fullName);
    setEditEmail(snap.email ?? "");
    setEditPhone(snap.phone ?? "");
    setEditCity(snap.city);
    setEditStateField(snap.state);
    setEditAadhaar(snap.aadhaar ?? "");
    setEditDgca(snap.dgca);
    setEditFlightHours(snap.flightHours);
    setEditSkillsText(snap.skills.join("\n"));
    setEditBio(snap.bio);
    setEditError(null);
    setEditOpen(true);
  }

  function handleEditSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const base = readSnapshot();
    if (!base) return;

    const name = editFullName.trim();
    const city = editCity.trim();
    const st = editStateField.trim();
    if (!name || !city || !st) {
      setEditError("Full name, city, and state are required.");
      return;
    }
    setEditError(null);

    const hrsRaw = Number(editFlightHours);
    const hrs = Number.isFinite(hrsRaw)
      ? Math.max(0, Math.min(50000, Math.floor(hrsRaw)))
      : 0;

    const skills = normalizePilotSkillsForSnapshot(
      parseSkillsManual(editSkillsText)
    );

    const aadhaarDigits = editAadhaar.replace(/\D/g, "");
    let bioOut = replaceAbcPlaceholder(editBio.trim());
    if (editAadhaar.trim() && aadhaarDigits.length !== 12) {
      bioOut = [bioOut, `ID / reference: ${editAadhaar.trim()}`]
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }

    const snapshot: PilotProfileSnapshot = {
      fullName: replaceAbcPlaceholder(name),
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      city,
      state: st,
      aadhaar: aadhaarDigits.length === 12 ? aadhaarDigits : undefined,
      flightHours: hrs,
      bio: bioOut,
      skills,
      drones: base.drones,
      dgca: editDgca.trim(),
    };

    const json = JSON.stringify(snapshot);
    try {
      localStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    } catch {
      /* quota */
    }
    sessionStorage.setItem(PILOT_PROFILE_STORAGE_KEY, json);
    window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    refreshFromStorage();
    setEditOpen(false);
  }

  if (!ready) {
    return (
      <div
        className={
          variant === "dashboard"
            ? "flex min-h-[12rem] items-center justify-center bg-background text-xs text-foreground"
            : "flex min-h-dvh items-center justify-center bg-background text-xs text-foreground"
        }
      >
        Loading…
      </div>
    );
  }

  if (!data) {
    if (variant === "dashboard") {
      return (
        <div className="relative bg-background pb-10 pt-1 text-foreground">
          <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-8 shadow-sm">
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>Profile</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              No pilot profile is saved in this browser yet. Complete pilot
              registration to see details here.
            </p>
            <Link
              href="/pilot-registration"
              className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-[#008080] bg-card px-5 py-2.5 text-sm text-foreground shadow-sm transition hover:bg-[#008080]/10"
            >
              Register a pilot
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-xs text-foreground">
        Loading…
      </div>
    );
  }

  const displayName = data.fullName.trim() || "Pilot";
  const showDgcaBadge = Boolean(data.dgca.trim());
  const missionPct = missionSuccessPercent(data);
  const roleLine = data.skills[0]?.trim() ?? "";
  const certDisplay = showDgcaBadge ? "99.9%" : "—";
  const skillsCount = String(data.skills.length);

  const innerPad =
    variant === "dashboard"
      ? "mx-auto max-w-6xl px-0 pb-8 pt-0 sm:px-0"
      : "mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8";

  return (
    <div
      className={
        variant === "dashboard"
          ? "relative min-h-0 bg-background text-foreground"
          : "relative min-h-dvh bg-background text-foreground"
      }
    >
      <div className={innerPad}>
        {/* Top header — avatar, identity, edit */}
        <div className="flex flex-col gap-6 rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="flex size-[5.5rem] items-center justify-center rounded-full bg-sky-100 ring-4 ring-sky-50 dark:bg-sky-950/50 dark:ring-sky-900/40">
                <Headset
                  className="size-10 text-sky-700 dark:text-sky-300"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <span
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-border bg-card shadow-md"
                aria-hidden
              >
                <Settings className="size-3.5 text-foreground" />
              </span>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className={ADMIN_PAGE_TITLE_CLASS}>{displayName}</h1>
              <p
                className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-2 shrink-0 rounded-full ${showDgcaBadge ? "bg-emerald-500" : "bg-amber-400"}`}
                    aria-hidden
                  />
                  <span className="text-foreground">
                    {showDgcaBadge ? "Available" : "Review"}
                  </span>
                </span>
                {roleLine ? (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden>
                      ·
                    </span>
                    <span className="text-foreground">{roleLine}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 justify-center sm:justify-end">
            <button
              type="button"
              onClick={openEditDialog}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#008080] bg-card px-4 text-sm text-foreground shadow-sm transition hover:bg-[#008080]/10"
            >
              <Pencil className="size-4" aria-hidden />
              Edit
            </button>
          </div>
        </div>

        {editOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              aria-label="Close edit dialog"
              onClick={() => setEditOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
              className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <h2
                  id="edit-profile-title"
                  className="text-base text-foreground sm:text-lg"
                >
                  Edit profile
                </h2>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg p-2 text-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
              <form
                onSubmit={handleEditSave}
                className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-full-name"
                      className="text-sm text-foreground"
                    >
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="edit-full-name"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-email"
                        className="text-sm text-foreground"
                      >
                        Email
                      </label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="h-10 rounded-lg border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-phone"
                        className="text-sm text-foreground"
                      >
                        Phone
                      </label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="h-10 rounded-lg border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-city"
                        className="text-sm text-foreground"
                      >
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="edit-city"
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="h-10 rounded-lg border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-state"
                        className="text-sm text-foreground"
                      >
                        State / region <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="edit-state"
                        required
                        value={editStateField}
                        onChange={(e) => setEditStateField(e.target.value)}
                        className="h-10 rounded-lg border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-hours"
                        className="text-sm text-foreground"
                      >
                        Flight hours
                      </label>
                      <Input
                        id="edit-hours"
                        type="number"
                        min={0}
                        max={50000}
                        value={editFlightHours}
                        onChange={(e) =>
                          setEditFlightHours(Number(e.target.value))
                        }
                        className="h-10 rounded-lg border-border bg-background tabular-nums text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-dgca"
                        className="text-sm text-foreground"
                      >
                        DGCA license
                      </label>
                      <Input
                        id="edit-dgca"
                        value={editDgca}
                        onChange={(e) => setEditDgca(e.target.value)}
                        className="h-10 rounded-lg border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-aadhaar"
                      className="text-sm text-foreground"
                    >
                      Aadhaar (12 digits for masked profile ID)
                    </label>
                    <Input
                      id="edit-aadhaar"
                      value={editAadhaar}
                      onChange={(e) => setEditAadhaar(e.target.value)}
                      inputMode="numeric"
                      className="h-10 rounded-lg border-border bg-background tabular-nums text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Other text is appended to notes below.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-skills"
                      className="text-sm text-foreground"
                    >
                      Skills
                    </label>
                    <textarea
                      id="edit-skills"
                      value={editSkillsText}
                      onChange={(e) => setEditSkillsText(e.target.value)}
                      placeholder="One per line or comma-separated"
                      className={editTextareaClass}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-bio"
                      className="text-sm text-foreground"
                    >
                      Notes / bio
                    </label>
                    <textarea
                      id="edit-bio"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className={editTextareaClass}
                      rows={4}
                    />
                  </div>
                  {editError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {editError}
                    </p>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-lg bg-[#008B8B] text-white hover:bg-[#006b6b]"
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Metrics row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            icon={<UserRound className="size-5 text-sky-600 dark:text-sky-300" aria-hidden />}
            iconWrapClass="bg-sky-100 dark:bg-sky-950/45"
            value={String(data.flightHours)}
            label="Flight hours"
          />
          <MetricCard
            icon={<Shield className="size-5 text-emerald-600 dark:text-emerald-300" aria-hidden />}
            iconWrapClass="bg-emerald-100 dark:bg-emerald-950/45"
            value={certDisplay}
            label="Certificate sync"
          />
          <MetricCard
            icon={
              <LayoutGrid className="size-5 text-violet-600 dark:text-violet-300" aria-hidden />
            }
            iconWrapClass="bg-violet-100 dark:bg-violet-950/45"
            value={skillsCount}
            label="Skills active"
          />
          <MetricCard
            icon={<Settings className="size-5 text-orange-600 dark:text-orange-300" aria-hidden />}
            iconWrapClass="bg-orange-100 dark:bg-orange-950/45"
            value="4.9"
            label="Performance rating"
          />
        </div>

        {/* Detail cards */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3">
              <h2 className="text-sm tracking-wide text-white">
                Personal information
              </h2>
            </div>
            <div className="px-4 pb-1 pt-0">
              <InfoRow
                icon={<UserRound className="size-5 text-sky-600 dark:text-sky-300" />}
                iconClass="bg-sky-100 dark:bg-sky-950/45"
                label="Name"
                value={displayName}
              />
              <InfoRow
                icon={<Mail className="size-5 text-emerald-600 dark:text-emerald-300" />}
                iconClass="bg-emerald-100 dark:bg-emerald-950/45"
                label="Email"
                value={
                  data.email?.trim() ? (
                    <a
                      href={`mailto:${data.email.trim()}`}
                      className="text-foreground no-underline hover:text-[#008B8B]"
                    >
                      {data.email.trim()}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                icon={<Phone className="size-5 text-violet-600 dark:text-violet-300" />}
                iconClass="bg-violet-100 dark:bg-violet-950/45"
                label="Phone"
                value={
                  data.phone?.trim() ? (
                    <a
                      href={`tel:${data.phone.replace(/\s/g, "")}`}
                      className="text-foreground no-underline hover:text-[#008B8B]"
                    >
                      {data.phone.trim()}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3">
              <h2 className="text-sm tracking-wide text-white">
                Professional information
              </h2>
            </div>
            <div className="px-4 pb-1 pt-0">
              <InfoRow
                icon={<Clock className="size-5 text-sky-600 dark:text-sky-300" aria-hidden />}
                iconClass="bg-sky-100 dark:bg-sky-950/45"
                label="Flight hours"
                value={
                  <span className="tabular-nums">
                    {data.flightHours.toLocaleString("en-IN")}{" "}
                    <span className="text-muted-foreground">h</span>
                  </span>
                }
              />
              <InfoRow
                icon={<TrendingUp className="size-5 text-emerald-600 dark:text-emerald-300" aria-hidden />}
                iconClass="bg-emerald-100 dark:bg-emerald-950/45"
                label="Mission success"
                value={
                  <span className="inline-flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span
                      className="text-sm tabular-nums text-foreground"
                    >
                      {missionPct.toFixed(1)}%
                    </span>
                    <span className="h-2 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-muted sm:max-w-[10rem]">
                      <span
                        className="block h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, missionPct)}%` }}
                      />
                    </span>
                  </span>
                }
              />
              <InfoRow
                icon={<Circle className="size-5 fill-sky-500 text-sky-600 dark:fill-sky-400 dark:text-sky-300" />}
                iconClass="bg-sky-100 dark:bg-sky-950/45"
                label="Status"
                value={
                  <span className="inline-flex items-center gap-2">
                    {showDgcaBadge ? "Available" : "Pending verification"}
                    <span
                      className={`size-2 rounded-full ${showDgcaBadge ? "bg-emerald-500" : "bg-amber-400"}`}
                      aria-hidden
                    />
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
