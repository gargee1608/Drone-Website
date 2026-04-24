"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { patchPilotFlightHours } from "@/app/services/pilotServices";
import { fetchPilotSessionRow } from "@/lib/fetch-pilot-session-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPilotDisplayName,
  jwtPayloadRole,
  jwtPayloadSub,
} from "@/lib/pilot-display-name";
import { displayFlightHoursLikeProfilePage } from "@/lib/pilot-profile-flight-hours";
import { normalizePilotDutyStatus } from "@/lib/pilot-duty-status";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";
import {
  getDashboardPilotProfilePhoto,
  setPilotProfilePhotoDataUrl,
  snapshotForSharedStorage,
} from "@/lib/pilot-profile-photo-storage";
import {
  activePilotProfileSnapshotStorageKey,
  readPilotProfileSnapshotRawFromBrowser,
} from "@/lib/pilot-profile-browser-storage";
import {
  normalizePilotSkillsForSnapshot,
  parsePilotProfileSnapshot,
  PILOT_PROFILE_UPDATED_EVENT,
  replaceAbcPlaceholder,
  type PilotProfileSnapshot,
} from "@/lib/pilot-profile-snapshot";

const DRONE_STEP_REGISTRATION_HREF =
  "/pilot-registration?step=3&returnTo=%2Fpilot-profile";

function readSnapshot(): PilotProfileSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = readPilotProfileSnapshotRawFromBrowser();
  return parsePilotProfileSnapshot(raw);
}

function emptyPilotSnapshot(): PilotProfileSnapshot {
  return {
    fullName: "",
    email: undefined,
    phone: undefined,
    city: "",
    state: "",
    aadhaar: undefined,
    flightHours: 0,
    bio: "",
    skills: [],
    drones: [],
    dgca: "",
  };
}

/** Dashboard profile: merge saved snapshot with logged-in pilot (same name source as flight deck). */
function readSnapshotForPilotProfile(
  variant: PilotProfileViewVariant
): PilotProfileSnapshot | null {
  const base = readSnapshot();

  if (variant !== "dashboard") {
    return base;
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isPilotSession = Boolean(
    token && jwtPayloadRole(token) === "pilot"
  );

  if (!isPilotSession) {
    return base;
  }

  const displayName = getPilotDisplayName(token);
  let pilotEmail: string | undefined;
  try {
    const raw = localStorage.getItem("pilot");
    if (raw) {
      const p = JSON.parse(raw) as { email?: string };
      pilotEmail = p.email?.trim() || undefined;
    }
  } catch {
    /* ignore */
  }

  const sub = token ? jwtPayloadSub(token) : null;

  if (base) {
    /** Saved snapshot wins over JWT/login so Edit profile → Save actually persists. */
    const mergedName =
      base.fullName.trim() !== ""
        ? base.fullName.trim()
        : displayName !== "Pilot"
          ? displayName
          : base.fullName.trim() || displayName;
    const mergedEmail =
      base.email != null && String(base.email).trim() !== ""
        ? String(base.email).trim()
        : pilotEmail ?? base.email;
    const photoDataUrl =
      sub && isPilotSession
        ? getDashboardPilotProfilePhoto(sub, base, pilotEmail)
        : base.photoDataUrl;
    return {
      ...base,
      fullName: mergedName,
      email: mergedEmail,
      photoDataUrl,
    };
  }

  return {
    ...emptyPilotSnapshot(),
    fullName: displayName,
    email: pilotEmail,
    photoDataUrl:
      sub && isPilotSession
        ? getDashboardPilotProfilePhoto(sub, null, pilotEmail)
        : undefined,
  };
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
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${iconWrapClass}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-2xl tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
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
    <div className="flex items-start gap-3 border-b border-border/80 py-3.5 last:border-b-0">
      <div
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          {label}
        </p>
        <div className="mt-1 text-[13px] text-foreground sm:text-sm">{value}</div>
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
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [backendDuty, setBackendDuty] = useState<
    "ACTIVE" | "INACTIVE" | null
  >(null);
  const [backendDutyLoading, setBackendDutyLoading] = useState(false);
  /** Fetched `pilots` row when `GET /api/pilots/:id` succeeds; drives flight hours with same logic as Dashboard. */
  const [pilotApiRow, setPilotApiRow] = useState<Record<
    string,
    unknown
  > | null>(null);

  const refreshFromStorage = useCallback(() => {
    setData(readSnapshotForPilotProfile(variant));
  }, [variant]);

  useEffect(() => {
    const snap = readSnapshotForPilotProfile(variant);
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
    if (variant !== "dashboard") {
      setBackendDuty(null);
      setBackendDutyLoading(false);
      setPilotApiRow(null);
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || jwtPayloadRole(token) !== "pilot") {
      setBackendDuty(null);
      setBackendDutyLoading(false);
      setPilotApiRow(null);
      return;
    }

    const idRaw = jwtPayloadSub(token);
    const pilotId = idRaw ? Number.parseInt(idRaw, 10) : NaN;
    if (!Number.isFinite(pilotId)) {
      setBackendDuty(null);
      setBackendDutyLoading(false);
      setPilotApiRow(null);
      return;
    }

    let cancelled = false;

    async function loadPilotRow() {
      setBackendDutyLoading(true);
      const row = await fetchPilotSessionRow(idRaw);
      if (cancelled) return;
      setBackendDutyLoading(false);
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const r = row as Record<string, unknown>;
        setBackendDuty(
          normalizePilotDutyStatus(r.duty_status ?? r.dutyStatus)
        );
        setPilotApiRow(r);
      } else {
        setBackendDuty(null);
        setPilotApiRow(null);
      }
    }

    void loadPilotRow();

    function onVisible() {
      if (document.visibilityState !== "visible" || cancelled) return;
      void loadPilotRow();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [variant]);

  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen]);

  function openEditDialog() {
    const snap = readSnapshotForPilotProfile(variant);
    if (!snap) return;
    setEditFullName(snap.fullName);
    setEditEmail(snap.email ?? "");
    setEditPhone(snap.phone ?? "");
    setEditCity(snap.city);
    setEditStateField(snap.state);
    setEditAadhaar(snap.aadhaar ?? "");
    setEditDgca(snap.dgca);
    const t =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const preferApi = Boolean(
      variant === "dashboard" &&
        t &&
        jwtPayloadRole(t) === "pilot" &&
        pilotApiRow != null
    );
    setEditFlightHours(
      displayFlightHoursLikeProfilePage(pilotApiRow, {
        preferApiRowWhenPresent: preferApi,
        snapshotFallbackHours: snap.flightHours,
      })
    );
    setEditSkillsText(snap.skills.join("\n"));
    setEditBio(snap.bio);
    setEditError(null);
    setEditOpen(true);
  }

  function handleEditSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const base = readSnapshotForPilotProfile(variant);
    if (!base) {
      setEditError("Could not read your profile from this browser. Try reloading the page.");
      return;
    }

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
      photoDataUrl: base.photoDataUrl,
    };

    const json = JSON.stringify(snapshotForSharedStorage(snapshot));
    const storeKey = activePilotProfileSnapshotStorageKey();
    try {
      localStorage.setItem(storeKey, json);
    } catch {
      /* quota */
    }
    sessionStorage.setItem(storeKey, json);
    window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    refreshFromStorage();
    setEditOpen(false);

    if (variant === "dashboard") {
      const tok =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (tok && jwtPayloadRole(tok) === "pilot") {
        const raw = jwtPayloadSub(tok);
        const pid = raw ? Number.parseInt(raw, 10) : NaN;
        if (Number.isFinite(pid)) {
          /** Professional block uses API row for hours; merge now so UI updates even if PATCH is slow or fails. */
          setPilotApiRow((prev) =>
            prev && typeof prev === "object" && !Array.isArray(prev)
              ? {
                  ...prev,
                  flight_hours: hrs,
                  experience: String(hrs),
                }
              : prev
          );
          void (async () => {
            const patched = await patchPilotFlightHours(pid, hrs);
            const row =
              patched &&
              typeof patched === "object" &&
              "data" in patched &&
              patched.data &&
              typeof patched.data === "object"
                ? (patched.data as Record<string, unknown>)
                : await fetchPilotSessionRow(raw);
            if (row && typeof row === "object" && !Array.isArray(row)) {
              const r = row as Record<string, unknown>;
              setPilotApiRow(r);
              setBackendDuty(
                normalizePilotDutyStatus(r.duty_status ?? r.dutyStatus)
              );
            }
          })();
        }
      }
    }
  }

  function persistProfileSnapshot(snapshot: PilotProfileSnapshot) {
    const json = JSON.stringify(snapshotForSharedStorage(snapshot));
    const storeKey = activePilotProfileSnapshotStorageKey();
    try {
      localStorage.setItem(storeKey, json);
    } catch {
      /* quota */
    }
    sessionStorage.setItem(storeKey, json);
    window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
    setData(snapshot);
    refreshFromStorage();
  }

  function handleDroneDelete(index: number) {
    const snap = readSnapshotForPilotProfile(variant);
    if (!snap) return;
    if (!snap.drones[index]) return;
    const nextDrones = snap.drones.filter((_, i) => i !== index);
    persistProfileSnapshot({ ...snap, drones: nextDrones });
  }

  function goToPilotRegistrationDroneStep() {
    router.push(DRONE_STEP_REGISTRATION_HREF);
  }

  function openPilotPhotoPicker() {
    setAvatarError(null);
    photoFileInputRef.current?.click();
  }

  function handlePilotPhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    const maxBytes = Math.floor(1.5 * 1024 * 1024);
    if (file.size > maxBytes) {
      setAvatarError("Image must be about 1.5 MB or smaller.");
      return;
    }
    const snap = readSnapshotForPilotProfile(variant);
    if (!snap) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        setAvatarError("Could not read that image.");
        return;
      }
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const sub = token ? jwtPayloadSub(token) : null;
      if (
        token &&
        sub &&
        jwtPayloadRole(token) === "pilot"
      ) {
        setPilotProfilePhotoDataUrl(sub, dataUrl);
      }
      persistProfileSnapshot({ ...snap, photoDataUrl: dataUrl });
      setAvatarError(null);
    };
    reader.onerror = () => setAvatarError("Could not read that image.");
    reader.readAsDataURL(file);
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
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const isPilot =
        token !== null && jwtPayloadRole(token) === "pilot";
      return (
        <div className="relative bg-background pb-10 pt-1 text-foreground">
          <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-8 shadow-sm">
            <h1 className={ADMIN_PAGE_TITLE_CLASS}>Profile</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {isPilot
                ? "Could not load your profile. Try opening this page again, or complete registration to save full details in this browser."
                : "No profile is saved in this browser yet. Sign in as a pilot or complete registration to see details here."}
            </p>
            <Link
              href={isPilot ? "/pilot-dashboard" : "/pilot-registration"}
              className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-[#008080] bg-card px-5 py-2.5 text-sm text-foreground shadow-sm transition hover:bg-[#008080]/10"
            >
              {isPilot ? "Back to dashboard" : "New Registration"}
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
  const tokenForDuty =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const useBackendDutyForStatus = Boolean(
    variant === "dashboard" &&
      tokenForDuty &&
      jwtPayloadRole(tokenForDuty) === "pilot"
  );

  let headerStatusDotClass: string;
  let headerStatusText: string;
  let rowStatusDotClass: string;
  let rowStatusText: string;

  if (useBackendDutyForStatus) {
    const dot = backendDutyLoading
      ? "bg-muted-foreground/40"
      : backendDuty !== null
        ? backendDuty === "ACTIVE"
          ? "bg-emerald-500"
          : "bg-muted-foreground/50"
        : "bg-muted-foreground/50";
    const text = backendDutyLoading
      ? "…"
      : backendDuty !== null
        ? backendDuty
        : "Inactive";
    headerStatusDotClass = rowStatusDotClass = dot;
    headerStatusText = rowStatusText = text;
  } else {
    headerStatusDotClass = rowStatusDotClass = showDgcaBadge
      ? "bg-emerald-500"
      : "bg-amber-400";
    headerStatusText = showDgcaBadge ? "Available" : "Review";
    rowStatusText = showDgcaBadge ? "Available" : "Pending verification";
  }

  const effectiveFlightHours = displayFlightHoursLikeProfilePage(
    pilotApiRow,
    {
      preferApiRowWhenPresent: useBackendDutyForStatus,
      snapshotFallbackHours: data.flightHours,
    }
  );

  const missionPct = missionSuccessPercent(data);
  const certDisplay = showDgcaBadge ? "99.9%" : "—";
  const skillsCount = String(data.skills.length);

  const innerPad =
    variant === "dashboard"
      ? "mx-auto max-w-[1120px] px-0 pb-8 pt-0 sm:px-0"
      : "mx-auto max-w-[1120px] px-4 pb-12 pt-22 sm:px-6 sm:pt-24";

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
        <div
          className={
            variant === "dashboard"
              ? "relative"
              : "relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5 lg:p-6"
          }
        >
          {variant !== "dashboard" ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[#008B8B]/12 via-sky-500/10 to-emerald-500/10"
            />
          ) : null}
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
            <div className="relative mx-auto mb-1 mr-1 flex shrink-0 flex-col items-center sm:mx-0 sm:items-start">
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={handlePilotPhotoSelected}
              />
              <button
                type="button"
                onClick={openPilotPhotoPicker}
                className="relative size-[4.75rem] shrink-0 rounded-full p-0 ring-4 ring-sky-50 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:ring-sky-900/40"
                aria-label={
                  data.photoDataUrl
                    ? "Edit profile photo"
                    : "Add profile photo"
                }
              >
                <span
                  className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-full ${
                    data.photoDataUrl
                      ? "bg-muted"
                      : "bg-sky-100 dark:bg-sky-950/50"
                  }`}
                >
                  {data.photoDataUrl ? (
                    <Image
                      src={data.photoDataUrl}
                      alt=""
                      width={76}
                      height={76}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <Headset
                      className="size-8 text-sky-700 dark:text-sky-300"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  )}
                </span>
                <span
                  className="pointer-events-none absolute -bottom-1 -right-1 z-[1] flex size-7 items-center justify-center rounded-full bg-[#008080] text-white shadow-md ring-2 ring-background dark:ring-card"
                  aria-hidden
                >
                  <Pencil className="size-3.5" strokeWidth={2.25} />
                </span>
              </button>
              {avatarError ? (
                <p
                  className="mt-2 max-w-[12rem] text-center text-xs text-red-600 sm:text-left"
                  role="alert"
                >
                  {avatarError}
                </p>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className={ADMIN_PAGE_TITLE_CLASS}>{displayName}</h1>
              <p
                className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-2 shrink-0 rounded-full ${headerStatusDotClass}`}
                    aria-hidden
                  />
                  <span className="text-foreground">{headerStatusText}</span>
                </span>
              </p>
            </div>
            </div>
            <div className="flex shrink-0 justify-center sm:justify-end">
              <button
                type="button"
                onClick={openEditDialog}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#008080] bg-card px-3.5 text-sm text-foreground shadow-sm transition hover:bg-[#008080]/10"
              >
                <Pencil className="size-4" aria-hidden />
                Edit profile
              </button>
            </div>
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
                id="pilot-profile-edit-form"
                noValidate
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
                        value={Number.isFinite(editFlightHours) ? editFlightHours : 0}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setEditFlightHours(0);
                            return;
                          }
                          const n = Number.parseInt(raw, 10);
                          setEditFlightHours(
                            Number.isFinite(n)
                              ? Math.max(0, Math.min(50000, n))
                              : 0
                          );
                        }}
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
                  {/*
                    Native submit: @base-ui/react Button merges getButtonProps() after
                    element props and forces type="button", so type="submit" never applied
                    and the form never submitted.
                  */}
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "rounded-lg bg-[#008B8B] text-white hover:bg-[#006b6b]"
                    )}
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {variant !== "dashboard" ? (
          <>
            {/* Metrics row — hidden on Pilot Dashboard profile */}
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
          </>
        ) : null}

        {/* Detail cards */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="border-b border-border/80 bg-muted/35 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Personal information
              </h2>
            </div>
            <div className="px-4 pb-0.5 pt-0">
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

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="border-b border-border/80 bg-muted/35 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Professional information
              </h2>
            </div>
            <div className="px-4 pb-0.5 pt-0">
              <InfoRow
                icon={<Clock className="size-5 text-sky-600 dark:text-sky-300" aria-hidden />}
                iconClass="bg-sky-100 dark:bg-sky-950/45"
                label="Flight hours"
                value={
                  <span className="tabular-nums">
                    {effectiveFlightHours.toLocaleString("en-IN")}{" "}
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
                    {rowStatusText}
                    <span
                      className={`size-2 rounded-full ${rowStatusDotClass}`}
                      aria-hidden
                    />
                  </span>
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/35 px-4 py-3">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Drone details
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={goToPilotRegistrationDroneStep}
              className="h-8 rounded-lg border-[#008080] text-xs text-foreground hover:bg-[#008080]/10"
            >
              Add Drone Details
            </Button>
          </div>
          <div className="px-4 py-4">
            {data.drones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No drone details added yet.
                </p>
                <Button
                  type="button"
                  onClick={goToPilotRegistrationDroneStep}
                  className="mt-3 h-8 rounded-lg bg-[#008B8B] px-3 text-xs text-white hover:bg-[#006b6b]"
                >
                  Add Drone Details
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.drones.map((drone, idx) => (
                  <div
                    key={drone.id || `${drone.modelName}-${idx}`}
                    className="rounded-xl border border-border p-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {drone.modelName || "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {drone.type || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goToPilotRegistrationDroneStep}
                          className="h-8 rounded-lg px-3 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDroneDelete(idx)}
                          className="h-8 rounded-lg px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-white dark:hover:bg-red-950/40 dark:hover:text-white"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <p>
                        <span className="font-semibold text-foreground">Camera:</span>{" "}
                        {drone.camera || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Payload:</span>{" "}
                        {drone.payloadKg || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Flight time:</span>{" "}
                        {drone.flightTimeMin || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Range:</span>{" "}
                        {drone.rangeKm || "—"}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Use cases:</span>{" "}
                      {drone.useCases?.length ? drone.useCases.join(", ") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
