"use client";

import {
  Calendar,
  FolderKanban,
  Mail,
  MapPin,
  User,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { getPilots, assignHubMissionToPilot } from "@/app/services/pilotServices";
import { DetailField } from "@/components/dashboard/user-request-detail-modal";
import { apiUrl } from "@/lib/api-url";
import { pushPilotMissionNotification } from "@/lib/pilot-mission-notifications";
import type { ParsedPostRequirement } from "@/lib/post-requirement-parse";
import {
  getUserMissionTrackingEntryForRequest,
  recordUserMissionAssignment,
} from "@/lib/user-mission-tracking";
import {
  notifyProjectRequestsUpdated,
  projectRequestMissionRef,
} from "@/lib/project-requests";
import {
  missionOwnerFieldsForRequestRef,
  notifyMissionsDbUpdated,
  userMissionAdminStatusLabel,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const innerBoxClass =
  "rounded-lg border border-border/80 bg-muted/25 px-2.5 py-2 dark:border-white/10 dark:bg-white/5";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#008B8B] dark:text-[#5eead4]">
      {children}
    </h3>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  const display = value.trim() || "—";
  return (
    <div className={innerBoxClass}>
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-medium leading-snug text-foreground">
        {display}
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof User;
  label: string;
  value: string;
  href?: string;
}) {
  const display = value.trim() || "—";
  return (
    <div className={cn("flex gap-2", innerBoxClass)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/10 text-[#008B8B] dark:bg-[#008B8B]/20 dark:text-[#5eead4]">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {href && display !== "—" ? (
          <a
            href={href}
            className="mt-px block truncate text-xs font-medium text-foreground underline-offset-2 hover:text-[#008B8B] hover:underline dark:hover:text-[#5eead4]"
          >
            {display}
          </a>
        ) : (
          <p className="mt-px break-words text-xs font-medium text-foreground">
            {display}
          </p>
        )}
      </div>
    </div>
  );
}

export type ProjectRequestDetailContact = {
  title: string;
  phone: string | null;
  name: string;
  email: string;
  project: ParsedPostRequirement | null;
};

type PilotOption = {
  id: string;
  name: string;
  badgeId: string;
};

function normalizePilotOption(row: unknown): PilotOption | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const record = row as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  if (!id) return null;
  const name = String(record.name ?? "").trim() || `Pilot #${id}`;
  const duty = String(record.duty_status ?? record.dutyStatus ?? "ACTIVE")
    .trim()
    .toUpperCase();
  if (duty !== "ACTIVE") return null;
  const badgeId =
    String(record.license_number ?? record.licenseNumber ?? "").trim() ||
    `PLT-${id}`;
  return { id, name, badgeId };
}

export function ProjectRequestDetailModal({
  row,
  contact,
  onClose,
  onAssigned,
  hideAssignPilot = false,
}: {
  row: UserRequestAdminRow;
  contact: ProjectRequestDetailContact;
  onClose: () => void;
  onAssigned?: () => void;
  /** Pilot dashboard: read-only details without admin assign controls. */
  hideAssignPilot?: boolean;
}) {
  const requestId = row.queueDisplayId ?? row.key;
  const backend = row.backendRequest;
  const project = contact.project;
  const adminStatus = backend?.adminStatus;
  const missionRef = projectRequestMissionRef(row);

  const [pilots, setPilots] = useState<PilotOption[]>([]);
  const [pilotsLoading, setPilotsLoading] = useState(true);
  const [pilotsError, setPilotsError] = useState<string | null>(null);
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  const sortedPilots = useMemo(
    () =>
      [...pilots].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [pilots]
  );

  useEffect(() => {
    if (hideAssignPilot) {
      setPilots([]);
      setPilotsLoading(false);
      setPilotsError(null);
      return;
    }

    let cancelled = false;
    async function loadPilots() {
      setPilotsLoading(true);
      setPilotsError(null);
      const data = await getPilots();
      if (cancelled) return;
      if (!Array.isArray(data)) {
        setPilots([]);
        setPilotsError("Could not load pilots right now.");
        setPilotsLoading(false);
        return;
      }
      setPilots(
        data
          .map(normalizePilotOption)
          .filter((pilot): pilot is PilotOption => pilot != null)
      );
      setPilotsLoading(false);
    }
    void loadPilots();
    return () => {
      cancelled = true;
    };
  }, [hideAssignPilot]);

  useEffect(() => {
    if (hideAssignPilot) return;
    const tracking = getUserMissionTrackingEntryForRequest(missionRef);
    if (tracking?.pilotSub?.trim()) {
      setSelectedPilotId(tracking.pilotSub.trim());
    }
  }, [hideAssignPilot, missionRef]);

  const handleAssignPilot = async () => {
    if (!selectedPilotId || assigning || !project) return;
    const pilot = pilots.find((item) => item.id === selectedPilotId);
    if (!pilot) return;

    setAssigning(true);
    setAssignError(null);
    setAssignFeedback(null);

    const ownerFields = missionOwnerFieldsForRequestRef(missionRef);
    const service = project.serviceCategory.trim() || contact.title;
    const location =
      project.preferredLocation.trim() ||
      project.areaOfCoverage.trim() ||
      "—";

    const res = await assignHubMissionToPilot({
      requestRef: missionRef,
      customer: contact.title.trim() || row.title.trim() || "Project request",
      service,
      dropoff: location,
      pilotName: pilot.name,
      pilotBadgeId: pilot.badgeId,
      pilotSub: pilot.id,
      droneModel: "—",
      userName: ownerFields.userName || contact.name.trim(),
      userEmail: ownerFields.userEmail || contact.email.trim(),
      assignedAt: new Date().toISOString(),
    });

    if (!res?.ok) {
      setAssigning(false);
      setAssignError(
        typeof res?.detail === "string" && res.detail
          ? res.detail
          : "Could not assign pilot. Is the backend running?"
      );
      return;
    }

    if (backend?.id) {
      try {
        await fetch(apiUrl(`/api/requests/${encodeURIComponent(backend.id)}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_status: "accepted" }),
        });
      } catch {
        /* optional sync */
      }
    }

    pushPilotMissionNotification({
      requestRef: missionRef,
      customer: contact.title.trim() || row.title.trim() || "Project request",
      service,
      dropoff: location,
      pilotName: pilot.name,
      pilotBadgeId: pilot.badgeId,
      pilotSub: pilot.id,
      droneModel: "—",
    });

    recordUserMissionAssignment({
      requestRef: missionRef,
      pilotSub: pilot.id,
      pilotName: pilot.name,
      pilotBadgeId: pilot.badgeId,
      droneModel: "—",
      userStatus: "in_progress",
      storedUserRequest: undefined,
      assignRowFallback: {
        customer: contact.title.trim() || row.title.trim() || "Project request",
        service,
        dropoff: location,
        sectorLine: row.desc,
      },
    });

    notifyMissionsDbUpdated();
    notifyProjectRequestsUpdated();
    onAssigned?.();
    setAssigning(false);
    setAssignFeedback(
      res.alreadyAssigned
        ? `${pilot.name} is already assigned to this request.`
        : `${pilot.name} has been assigned to this project request.`
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
        aria-label="Close project request details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-request-detail-title"
        className="relative z-10 flex max-h-[min(90dvh,40rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white text-foreground shadow-2xl sm:rounded-2xl dark:border-white/20 dark:bg-black dark:text-white"
      >
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-[#008B8B]/8 via-transparent to-transparent px-5 py-4 sm:px-6 dark:border-white/10 dark:from-[#008B8B]/15">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#008B8B] text-white shadow-sm">
                <FolderKanban className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="project-request-detail-title"
                  className="text-base font-bold leading-tight sm:text-lg"
                >
                  Project request details
                </h2>
                <p
                  className="mt-1 font-mono text-xs text-muted-foreground"
                  title={requestId}
                >
                  {requestId}
                </p>
                {adminStatus ? (
                  <span className="mt-2 inline-flex items-center rounded-full border border-[#008B8B]/25 bg-[#008B8B]/8 px-2.5 py-0.5 text-[10px] font-semibold text-[#0a3030] dark:border-[#5eead4]/30 dark:bg-[#008B8B]/20 dark:text-[#5eead4]">
                    {userMissionAdminStatusLabel(adminStatus)}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted dark:text-white/80 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="rounded-lg border border-[#008B8B]/20 bg-[#008B8B]/5 px-2.5 py-2 dark:border-[#5eead4]/25 dark:bg-[#008B8B]/10">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#5eead4]">
              Project title
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-snug text-foreground">
              {contact.title || "—"}
            </p>
          </div>

          {project ? (
            <>
              <section className="mt-4 space-y-2" aria-label="Project information">
                <SectionHeading>1. Project information</SectionHeading>
                <dl className="grid gap-1.5 sm:grid-cols-2">
                  <DetailBox
                    label="Service category"
                    value={project.serviceCategory}
                  />
                  <DetailBox label="Project type" value={project.projectType} />
                  <div className="sm:col-span-2">
                    <DetailBox
                      label="Preferred location"
                      value={project.preferredLocation}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className={innerBoxClass}>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                        Project description
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-xs font-medium leading-snug">
                        {project.projectDescription.trim() || "—"}
                      </p>
                    </div>
                  </div>
                </dl>
              </section>

              <section className="mt-4 space-y-2" aria-label="Project details">
                <SectionHeading>2. Project details</SectionHeading>
                <dl className="grid gap-1.5 sm:grid-cols-2">
                  <div className={innerBoxClass}>
                    <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Calendar className="size-2.5" aria-hidden />
                      Expected start
                    </p>
                    <p className="mt-0.5 text-xs font-medium">
                      {project.expectedStartDate.trim() || "—"}
                    </p>
                  </div>
                  <DetailBox
                    label="Expected end date"
                    value={project.expectedDuration}
                  />
                  <DetailBox label="Budget (INR)" value={project.budgetRange} />
                  <DetailBox
                    label="Area of coverage"
                    value={project.areaOfCoverage}
                  />
                  <div className="sm:col-span-2">
                    <DetailBox
                      label="Purpose of project"
                      value={project.purposeOfProject}
                    />
                  </div>
                </dl>
              </section>

              <section className="mt-4 space-y-2" aria-label="Additional information">
                <SectionHeading>3. Additional information</SectionHeading>
                {project.referenceFileNames.length > 0 ? (
                  <DetailBox
                    label="Reference files"
                    value={project.referenceFileNames.join(", ")}
                  />
                ) : null}
                <div className={innerBoxClass}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    Additional notes
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs font-medium leading-snug">
                    {project.additionalNotes.trim() || "—"}
                  </p>
                </div>
              </section>

              <section className="mt-4 space-y-2" aria-label="Contact details">
                <SectionHeading>4. Contact details</SectionHeading>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  <ContactRow
                    icon={User}
                    label="Name"
                    value={project.contactName.trim() || contact.name}
                  />
                  <ContactRow
                    icon={Mail}
                    label="Email id"
                    value={project.contactEmail.trim() || contact.email}
                    href={(() => {
                      const email =
                        project.contactEmail.trim() || contact.email;
                      return email.includes("@")
                        ? `mailto:${email}`
                        : undefined;
                    })()}
                  />
                </div>
              </section>

              {!hideAssignPilot ? (
                <section className="mt-4 space-y-2" aria-label="Assign pilot">
                  <SectionHeading>Assign pilot</SectionHeading>
                  <div className={cn("space-y-3", innerBoxClass)}>
                    <div className="flex items-start gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/10 text-[#008B8B]">
                        <UserRound className="size-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor="project-request-assign-pilot"
                          className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground"
                        >
                          Assign pilot
                        </label>
                        {pilotsLoading ? (
                          <p className="mt-1 text-xs text-muted-foreground" role="status">
                            Loading pilots…
                          </p>
                        ) : pilotsError ? (
                          <p className="mt-1 text-xs text-red-600" role="alert">
                            {pilotsError}
                          </p>
                        ) : sortedPilots.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No active pilots are available to assign yet.
                          </p>
                        ) : (
                          <select
                            id="project-request-assign-pilot"
                            value={selectedPilotId}
                            onChange={(e) => {
                              setSelectedPilotId(e.target.value);
                              setAssignError(null);
                              setAssignFeedback(null);
                            }}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/35 dark:border-white/20 dark:bg-black dark:text-white"
                          >
                            <option value="">Choose a pilot…</option>
                            {sortedPilots.map((pilot) => (
                              <option key={pilot.id} value={pilot.id}>
                                {pilot.name}
                                {pilot.badgeId ? ` · ${pilot.badgeId}` : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    {!pilotsLoading && sortedPilots.length > 0 ? (
                      <button
                        type="button"
                        disabled={!selectedPilotId || assigning}
                        onClick={() => void handleAssignPilot()}
                        className="w-full rounded-lg bg-[#008B8B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#007474] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigning ? "Assigning…" : "Assign pilot"}
                      </button>
                    ) : null}
                    {assignError ? (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {assignError}
                      </p>
                    ) : null}
                    {assignFeedback ? (
                      <p
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100"
                        role="status"
                      >
                        {assignFeedback}
                      </p>
                    ) : null}
                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      {project.preferredLocation.trim() || "Location TBC"}
                    </p>
                  </div>
                </section>
              ) : null}
            </>
          ) : backend ? (
            <section className="mt-4">
              <dl className={innerBoxClass}>
                <DetailField label="Summary">
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {row.desc}
                  </span>
                </DetailField>
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
