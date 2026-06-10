"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
  MapPin,
  MessageSquareText,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getPilotPendingMissionAssignments,
  incrementPilotMissionsCompleted,
  saveCompletedMission,
} from "@/app/services/pilotServices";
import { apiUrl } from "@/lib/api-url";
import {
  type BackendDroneHireRequestRow,
  mapBackendRequestToAdminRow,
} from "@/lib/drone-hire-request-admin-map";
import { jwtPayloadSub } from "@/lib/pilot-display-name";
import {
  fetchPilotProjectMissionRefs,
  filterPilotAssignedProjectRows,
} from "@/lib/pilot-project-request-scope";
import {
  PILOT_COMMENT_WEATHER_PRESET,
  pilotMissionCommentForDisplay,
} from "@/lib/pilot-mission-comment-display";
import {
  loadPilotMissionCommentText,
  savePilotMissionComment,
} from "@/lib/pilot-mission-comments-storage";
import {
  notificationsVisibleToPilot,
  PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
  removePilotMissionNotificationById,
  type PilotMissionNotification,
} from "@/lib/pilot-mission-notifications";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import {
  isCompletedProjectRequest,
  isProjectRequirementRequest,
  notifyProjectRequestsUpdated,
  PROJECT_REQUESTS_UPDATED_EVENT,
  projectRequestMissionRef,
  projectRequestRefAliases,
} from "@/lib/project-requests";
import {
  getUserMissionTrackingEntryForRequest,
  updateUserMissionTrackingStatusToCompleted,
} from "@/lib/user-mission-tracking";
import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
import {
  missionOwnerFieldsForRequestRef,
  MISSIONS_DB_UPDATED_EVENT,
  notifyMissionsDbUpdated,
  type UserRequestAdminRow,
} from "@/lib/user-requests";

function missionDbIdFromNotification(row: PilotMissionNotification): string | undefined {
  if (!row.id.startsWith("db:")) return undefined;
  const id = row.id.slice(3).trim();
  return id || undefined;
}

function formatAssignedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function assignmentKey(n: PilotMissionNotification): string {
  return `${(n.pilotSub ?? "").trim()}::${n.requestRef.trim()}`;
}

function pilotProjectCardDomId(requestRef: string): string {
  return `pilot-project-${requestRef.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function dbMissionRowToNotification(
  row: Record<string, unknown>
): PilotMissionNotification | null {
  const requestRef = String(row.request_ref ?? row.requestRef ?? "").trim();
  if (!requestRef || !isProjectRequirementRequest(requestRef)) return null;
  const idRaw = row.id;
  const id = `db:${String(idRaw ?? "")}`;
  const assignedRaw = row.assigned_at ?? row.assignedAt;
  let assignedAt = new Date().toISOString();
  if (assignedRaw) {
    const d = new Date(String(assignedRaw));
    if (!Number.isNaN(d.getTime())) assignedAt = d.toISOString();
  }
  return {
    id,
    requestRef,
    customer: String(row.customer ?? ""),
    service: String(row.service ?? ""),
    dropoff: String(row.dropoff ?? ""),
    pilotName: String(row.pilot_name ?? row.pilotName ?? ""),
    pilotBadgeId: String(row.pilot_badge_id ?? row.pilotBadgeId ?? ""),
    pilotSub: String(row.pilot_sub ?? row.pilotSub ?? "").trim() || undefined,
    droneModel: String(row.drone_model ?? row.droneModel ?? ""),
    assignedAt,
  };
}

function mergePilotMissionRows(
  fromApi: PilotMissionNotification[],
  fromLocal: PilotMissionNotification[]
): PilotMissionNotification[] {
  const keys = new Set(fromApi.map(assignmentKey));
  const extra = fromLocal.filter((n) => !keys.has(assignmentKey(n)));
  return [...fromApi, ...extra].sort(
    (a, b) =>
      new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );
}

function rowToProjectNotification(
  row: UserRequestAdminRow,
  pilotSub: string | null
): PilotMissionNotification {
  const requestRef = projectRequestMissionRef(row);
  const tracking = getUserMissionTrackingEntryForRequest(requestRef);
  const project = row.projectRequirement;
  return {
    id: `row:${row.key}`,
    requestRef,
    customer: project?.projectTitle?.trim() || row.title,
    service: project?.purposeOfProject?.trim() || "—",
    dropoff: project?.preferredLocation?.trim() || "—",
    pilotName: tracking?.pilotName || "",
    pilotBadgeId: tracking?.pilotBadgeId || "",
    pilotSub: tracking?.pilotSub?.trim() || pilotSub || undefined,
    droneModel: tracking?.droneModel || "—",
    assignedAt: tracking?.assignedAt || new Date().toISOString(),
  };
}

function findProjectRowForRef(
  requestRef: string,
  rows: UserRequestAdminRow[]
): UserRequestAdminRow | undefined {
  const norm = requestRef.trim().toLowerCase();
  return rows.find(
    (row) =>
      projectRequestRefAliases(row).includes(norm) ||
      projectRequestMissionRef(row).toLowerCase() === norm
  );
}

function NoSSR({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? <>{children}</> : null;
}

function ProjectRequestField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function AssignedProjectCard({
  row,
  expectedDuration,
  isSaving,
  savedCommentDisplay,
  onOpenComments,
  onComplete,
}: {
  row: PilotMissionNotification;
  expectedDuration: string;
  isSaving: boolean;
  savedCommentDisplay: string;
  onOpenComments: () => void;
  onComplete: () => void;
}) {
  const title = row.customer || row.requestRef || "Project request";

  return (
    <article
      id={pilotProjectCardDomId(row.requestRef)}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Assigned project
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {row.pilotName ? `Pilot: ${row.pilotName}` : "Awaiting pilot confirmation"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onOpenComments}
            disabled={isSaving}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#008B8B] px-3 text-xs font-medium text-[#008B8B] transition hover:bg-[#008B8B]/10 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
            Comments
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={isSaving}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                Completed
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProjectRequestField label="Request ID" value={row.requestRef} />
          <ProjectRequestField label="Purpose" value={row.service || "—"} />
          <ProjectRequestField label="Duration" value={expectedDuration} />
          <ProjectRequestField
            label="Assigned at"
            value={formatAssignedAt(row.assignedAt)}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#008B8B]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Location
            </p>
            <p className="mt-0.5 break-words">{row.dropoff || "Location TBC"}</p>
          </div>
        </div>

        {savedCommentDisplay ? (
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pilot comment
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {savedCommentDisplay}
            </p>
          </div>
        ) : null}

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-[#008B8B]" aria-hidden />
          Complete this project to update delivery status.
        </p>
      </div>
    </article>
  );
}

export function PilotProjectRequestsView() {
  const router = useRouter();
  const [apiRows, setApiRows] = useState<PilotMissionNotification[]>([]);
  const [projectRows, setProjectRows] = useState<UserRequestAdminRow[]>([]);
  const [pilotMissionRefs, setPilotMissionRefs] = useState<Set<string> | null>(
    null
  );
  const [pilotSub, setPilotSub] = useState<string | null>(null);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [localVers, setLocalVers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsForRow, setCommentsForRow] =
    useState<PilotMissionNotification | null>(null);
  const [commentsDisplayVers, setCommentsDisplayVers] = useState(0);
  const scopedProjectRows = useMemo(() => {
    return filterPilotAssignedProjectRows(
      projectRows,
      pilotMissionRefs,
      pilotSub
    );
  }, [projectRows, pilotMissionRefs, pilotSub]);

  const openProjectRows = useMemo(
    () => scopedProjectRows.filter((row) => !isCompletedProjectRequest(row)),
    [scopedProjectRows]
  );

  const rows = useMemo(() => {
    const localProjectNotifications = notificationsVisibleToPilot().filter(
      (row) => isProjectRequirementRequest(row.requestRef)
    );
    const merged = mergePilotMissionRows(apiRows, localProjectNotifications);
    const seen = new Set(
      merged.map((row) => row.requestRef.trim().toLowerCase())
    );
    const supplemental = openProjectRows
      .filter(
        (row) => !seen.has(projectRequestMissionRef(row).toLowerCase())
      )
      .map((row) => rowToProjectNotification(row, pilotSub));
    return [...merged, ...supplemental].sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
  }, [apiRows, localVers, openProjectRows, pilotSub]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.length,
      purposes: new Set(
        rows
          .map(
            (row) =>
              findProjectRowForRef(row.requestRef, openProjectRows)
                ?.projectRequirement?.purposeOfProject
          )
          .filter((purpose): purpose is string => Boolean(purpose?.trim()))
      ).size,
    }),
    [rows, openProjectRows]
  );

  const loadFromApi = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const sub = token ? jwtPayloadSub(token) : null;
    if (!sub) {
      setApiRows([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getPilotPendingMissionAssignments(sub);
      if (!data) {
        setApiRows([]);
        return;
      }
      const mapped = data
        .map((r: Record<string, unknown>) => dbMissionRowToNotification(r))
        .filter(
          (x: PilotMissionNotification | null): x is PilotMissionNotification =>
            x != null
        );
      setApiRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(apiUrl("/api/requests"), {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const data = Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data?: unknown[] }).data as BackendDroneHireRequestRow[])
          : [];
        if (!cancelled) {
          setProjectRows(
            data
              .filter((row) =>
                isProjectRequirementRequest(row.client_request_id)
              )
              .map(mapBackendRequestToAdminRow)
          );
        }
      } catch {
        if (!cancelled) setProjectRows([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [backendRefresh]);

  useEffect(() => {
    let cancelled = false;
    async function loadPilotMissions() {
      try {
        const { pilotSub: currentPilotSub, refs } =
          await fetchPilotProjectMissionRefs();
        if (!cancelled) {
          setPilotSub(currentPilotSub);
          setPilotMissionRefs(refs);
        }
      } catch {
        if (!cancelled) {
          setPilotSub(null);
          setPilotMissionRefs(new Set());
        }
      }
    }
    void loadPilotMissions();
    return () => {
      cancelled = true;
    };
  }, [backendRefresh]);

  useEffect(() => {
    void loadFromApi();
    const onFocus = () => void loadFromApi();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFromApi, backendRefresh]);

  useEffect(() => {
    const bump = () => {
      setBackendRefresh((n) => n + 1);
      setLocalVers((v) => v + 1);
    };
    window.addEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
    window.addEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
    window.addEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, bump);
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(PROJECT_REQUESTS_UPDATED_EVENT, bump);
      window.removeEventListener(MISSIONS_DB_UPDATED_EVENT, bump);
      window.removeEventListener(
        PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
        bump
      );
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    if (!commentsForRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommentsForRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentsForRow]);

  function openCommentsDialog(row: PilotMissionNotification) {
    setCommentsForRow(row);
    setCommentDraft(loadPilotMissionCommentText(row.requestRef));
  }

  async function saveCommentsDialog() {
    if (!commentsForRow) return;
    await savePilotMissionComment(
      {
        requestRef: commentsForRow.requestRef,
        id: missionDbIdFromNotification(commentsForRow),
        pilotSub: commentsForRow.pilotSub,
      },
      commentDraft
    );
    setCommentsForRow(null);
    setCommentsDisplayVers((v) => v + 1);
    setLocalVers((v) => v + 1);
  }

  async function handleCompletedProject(row: PilotMissionNotification) {
    if (savingRowId) return;
    setSavingRowId(row.id);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const currentPilotSub = token ? jwtPayloadSub(token) : null;
      const effectivePilotSub = row.pilotSub?.trim() || currentPilotSub || "";
      const missionRef = row.requestRef.trim();
      const ownerFields = missionOwnerFieldsForRequestRef(row.requestRef);

      const saveResult = await saveCompletedMission({
        requestRef: missionRef,
        customer: row.customer,
        service: row.service,
        dropoff: row.dropoff,
        pilotName: row.pilotName,
        pilotBadgeId: row.pilotBadgeId,
        pilotSub: effectivePilotSub,
        droneModel: row.droneModel,
        userName: ownerFields.userName,
        userEmail: ownerFields.userEmail,
        assignedAt: row.assignedAt,
        pilotComment: loadPilotMissionCommentText(row.requestRef),
      });

      if (!saveResult?.success) {
        removePilotMissionNotificationById(row.id);
        setLocalVers((v) => v + 1);
        alert(
          "Could not save project to database. Redirecting to Completed Project."
        );
        router.push("/pilot-dashboard/completed-projects");
        return;
      }

      if (effectivePilotSub) {
        await incrementPilotMissionsCompleted(effectivePilotSub, 1);
      }

      notifyMissionsDbUpdated();
      notifyProjectRequestsUpdated();
      updateUserMissionTrackingStatusToCompleted(row.requestRef);

      if (!row.id.startsWith("db:")) {
        removePilotMissionNotificationById(row.id);
      }
      await loadFromApi();
      setLocalVers((v) => v + 1);
      setBackendRefresh((n) => n + 1);
      router.push("/pilot-dashboard/completed-projects");
    } finally {
      setSavingRowId(null);
    }
  }

  return (
    <NoSSR>
      <section
        className="rounded-2xl bg-card px-4 pb-4 sm:px-6 sm:pb-6"
        style={{
          backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      >
        <header className="mb-5">
          <section
            className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3"
            aria-label="Project request summary"
          >
            <UserRequestStatCard
              label="Assigned projects"
              value={stats.total}
              icon={ClipboardList}
              iconClassName="text-[#008B8B]"
              iconWrapClassName="bg-[#008B8B]/10"
            />
            <UserRequestStatCard
              label="Active"
              value={stats.active}
              icon={Clock}
              iconClassName="text-amber-700"
              iconWrapClassName="bg-amber-100"
            />
            <UserRequestStatCard
              label="Purposes"
              value={stats.purposes}
              icon={FolderKanban}
              iconClassName="text-sky-800"
              iconWrapClassName="bg-sky-100"
            />
          </section>
        </header>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground dark:border-white/20">
              Loading project requests...
            </div>
          ) : rows.length === 0 ? (
            <article className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm sm:p-10">
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                <FolderKanban className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">
                No assigned project requests yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                When an admin assigns you a project request, it will appear here
                with request details, location, and actions to add notes or mark
                complete.
              </p>
            </article>
          ) : (
            rows.map((row) => {
              const savedComment = loadPilotMissionCommentText(row.requestRef);
              const savedCommentDisplay =
                pilotMissionCommentForDisplay(savedComment);
              const expectedDuration =
                findProjectRowForRef(row.requestRef, openProjectRows)
                  ?.projectRequirement?.expectedDuration || "—";

              return (
                <AssignedProjectCard
                  key={`${row.id}-${commentsDisplayVers}`}
                  row={row}
                  expectedDuration={expectedDuration}
                  isSaving={savingRowId === row.id}
                  savedCommentDisplay={savedCommentDisplay}
                  onOpenComments={() => openCommentsDialog(row)}
                  onComplete={() => void handleCompletedProject(row)}
                />
              );
            })
          )}
        </section>
      </section>

      {commentsForRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pilot-project-comments-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setCommentsForRow(null)}
          />
          <div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
              <h2
                id="pilot-project-comments-dialog-title"
                className="text-base font-bold text-foreground"
              >
                Project comments
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {commentsForRow.customer || "Project request"} ·{" "}
                {commentsForRow.requestRef}
              </p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <label
                htmlFor="pilot-project-comment"
                className="mb-2 block text-xs font-semibold text-muted-foreground"
              >
                Your comment
              </label>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Quick preset:{" "}
                <button
                  type="button"
                  className="font-medium text-[#008B8B] underline decoration-[#008B8B]/40 underline-offset-2 hover:decoration-[#008B8B] dark:text-primary"
                  onClick={() => setCommentDraft(PILOT_COMMENT_WEATHER_PRESET)}
                >
                  {PILOT_COMMENT_WEATHER_PRESET}
                </button>
              </p>
              <textarea
                id="pilot-project-comment"
                rows={5}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder={PILOT_COMMENT_WEATHER_PRESET}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#008B8B]/30"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setCommentsForRow(null)}
                className="rounded-lg border border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveCommentsDialog()}
                className="rounded-lg border-2 border-[#008B8B] bg-[#008B8B] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#007a7a] dark:border-primary dark:bg-primary dark:hover:bg-primary/90"
              >
                Save comment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NoSSR>
  );
}
