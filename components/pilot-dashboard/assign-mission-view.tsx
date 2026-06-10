"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageSquareText,
  Plane,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getPilotPendingMissionAssignments,
  incrementPilotMissionsCompleted,
  saveCompletedMission,
} from "@/app/services/pilotServices";
import { UserRequestStatCard } from "@/components/dashboard/user-request-stat-card";
import { jwtPayloadSub } from "@/lib/pilot-display-name";
import {
  missionOwnerFieldsForRequestRef,
  missionRequestRefForSave,
} from "@/lib/user-requests";
import {
  notificationsVisibleToPilot,
  PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
  removePilotMissionNotificationById,
  type PilotMissionNotification,
} from "@/lib/pilot-mission-notifications";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import {
  formatCommentTimestamp,
} from "@/lib/pilot-mission-comment-display";
import {
  appendPilotMissionComment,
  deletePilotMissionComment,
  loadPilotMissionComments,
  loadPilotMissionCommentText,
  type PilotMissionCommentEntry,
} from "@/lib/pilot-mission-comments-storage";
import {
  isProjectRequirementRequest,
  notifyProjectRequestsUpdated,
} from "@/lib/project-requests";
import { notifyMissionsDbUpdated } from "@/lib/user-requests";
import { updateUserMissionTrackingStatusToCompleted } from "@/lib/user-mission-tracking";
import { cn } from "@/lib/utils";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";

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

function pilotMissionCardDomId(requestRef: string): string {
  return `pilot-mission-${requestRef.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function dbMissionRowToNotification(
  row: Record<string, unknown>
): PilotMissionNotification | null {
  const requestRef = String(row.request_ref ?? row.requestRef ?? "").trim();
  if (!requestRef) return null;
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
    status: String(row.status ?? "assigned").trim() || "assigned",
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

function NoSSR({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? <>{children}</> : null;
}

function AssignMissionField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function AssignedMissionCard({
  row,
  isCompleted,
  isSaving,
  savedComments,
  deletingCommentAt,
  onOpenComments,
  onDeleteComment,
  onComplete,
}: {
  row: PilotMissionNotification;
  isCompleted: boolean;
  isSaving: boolean;
  savedComments: PilotMissionCommentEntry[];
  deletingCommentAt: string | null;
  onOpenComments: () => void;
  onDeleteComment: (createdAt: string) => void;
  onComplete: () => void;
}) {
  const title = row.customer || row.requestRef || "Mission";

  return (
    <article
      id={pilotMissionCardDomId(row.requestRef)}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isCompleted ? "Completed mission" : "Assigned mission"}
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {row.pilotName ? `Pilot: ${row.pilotName}` : "Awaiting pilot confirmation"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {!isCompleted ? (
              <button
                type="button"
                onClick={onOpenComments}
                disabled={isSaving}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#008B8B] px-3 text-xs font-medium text-[#008B8B] transition hover:bg-[#008B8B]/10 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
              >
                <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
                Comments
              </button>
            ) : null}
            <button
              type="button"
              onClick={onComplete}
              disabled={isSaving || isCompleted}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition disabled:opacity-50",
                isCompleted
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/30 dark:text-sky-300"
                  : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              )}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                  Mission completed
                </>
              ) : isSaving ? (
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
          <AssignMissionField label="Request ID" value={row.requestRef} />
          <AssignMissionField label="Service" value={row.service || "—"} />
          <AssignMissionField label="Drone" value={row.droneModel || "—"} />
          <AssignMissionField
            label="Assigned at"
            value={formatAssignedAt(row.assignedAt)}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#008B8B]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Destination
            </p>
            <p className="mt-0.5 break-words">{row.dropoff || "Destination TBD"}</p>
          </div>
        </div>

        {savedComments.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pilot comments
            </p>
            <ul className="mt-2 space-y-2">
              {savedComments.map((comment, index) => {
                const timestamp = formatCommentTimestamp(comment.createdAt);
                const isDeleting = deletingCommentAt === comment.createdAt;
                return (
                  <li
                    key={`${comment.createdAt}-${index}`}
                    className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground">
                        {comment.text}
                      </p>
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(comment.createdAt)}
                          disabled={Boolean(deletingCommentAt) || isSaving}
                          aria-label="Delete comment"
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="size-3" aria-hidden />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </div>
                    {timestamp ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {timestamp}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2
            className={cn(
              "size-4 shrink-0",
              isCompleted ? "text-sky-600" : "text-[#008B8B]"
            )}
            aria-hidden
          />
          {isCompleted
            ? "Mission completed successfully."
            : "Complete this mission to update delivery status."}
        </p>
      </div>
    </article>
  );
}

export function AssignMissionView() {
  const router = useRouter();
  const [apiRows, setApiRows] = useState<PilotMissionNotification[]>([]);
  const [localVers, setLocalVers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [deletingCommentAt, setDeletingCommentAt] = useState<string | null>(null);
  const [commentsForRow, setCommentsForRow] = useState<PilotMissionNotification | null>(null);
  const [dialogComments, setDialogComments] = useState<PilotMissionCommentEntry[]>([]);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("aerolaminar_completed_mission_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [commentsDisplayVers, setCommentsDisplayVers] = useState(0);

  const rows = useMemo(
    () =>
      mergePilotMissionRows(apiRows, notificationsVisibleToPilot()).filter(
        (row) => !isProjectRequirementRequest(row.requestRef)
      ),
    [apiRows, localVers]
  );

  const stats = useMemo(() => {
    let assigned = 0;
    let completed = 0;
    for (const row of rows) {
      if (completedMissionIds.has(row.id)) {
        completed += 1;
      } else {
        assigned += 1;
      }
    }
    return {
      total: rows.length,
      assigned,
      completed,
    };
  }, [rows, completedMissionIds]);

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
        .filter((x: PilotMissionNotification | null): x is PilotMissionNotification => x != null)
        .filter(
          (row: PilotMissionNotification) =>
            !isProjectRequirementRequest(row.requestRef)
        );
      setApiRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromApi();
    const onFocus = () => void loadFromApi();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFromApi]);

  useEffect(() => {
    const bump = () => setLocalVers((v) => v + 1);
    window.addEventListener(PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT, bump);
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(
        PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
        bump
      );
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, bump);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    if (!focus || rows.length === 0) return;
    const trimmed = focus.trim();
    if (!rows.some((r) => r.requestRef.trim() === trimmed)) return;
    const el = document.getElementById(pilotMissionCardDomId(trimmed));
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const url = new URL(window.location.href);
    if (url.searchParams.get("focus") === focus) {
      url.searchParams.delete("focus");
      window.history.replaceState(
        null,
        "",
        url.pathname + (url.search ? url.search : "")
      );
    }
  }, [rows]);

  useEffect(() => {
    if (!commentsForRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommentsForRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentsForRow]);

  function openCommentsDialog(row: PilotMissionNotification) {
    setCommentDraft("");
    setDialogComments(loadPilotMissionComments(row.requestRef));
    setCommentsForRow(row);
  }

  function refreshDialogComments(requestRef: string) {
    setDialogComments(loadPilotMissionComments(requestRef));
    setCommentsDisplayVers((v) => v + 1);
  }

  async function addCommentInDialog() {
    if (!commentsForRow || commentSaving) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) return;

    setCommentSaving(true);
    const ok = await appendPilotMissionComment(
      {
        requestRef: commentsForRow.requestRef,
        id: missionDbIdFromNotification(commentsForRow),
        pilotSub: commentsForRow.pilotSub,
      },
      trimmed
    );
    setCommentSaving(false);
    if (!ok) return;

    setCommentDraft("");
    refreshDialogComments(commentsForRow.requestRef);
  }

  async function deleteComment(
    row: PilotMissionNotification,
    createdAt: string
  ) {
    if (deletingCommentAt) return;

    setDeletingCommentAt(createdAt);
    const ok = await deletePilotMissionComment(
      {
        requestRef: row.requestRef,
        id: missionDbIdFromNotification(row),
        pilotSub: row.pilotSub,
      },
      createdAt
    );
    setDeletingCommentAt(null);
    if (!ok) return;

    if (commentsForRow?.requestRef.trim() === row.requestRef.trim()) {
      refreshDialogComments(row.requestRef);
    } else {
      setCommentsDisplayVers((v) => v + 1);
    }
  }

  async function handleCompletedMission(row: PilotMissionNotification) {
    if (savingRowId) return;
    setSavingRowId(row.id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const currentPilotSub = token ? jwtPayloadSub(token) : null;
      const effectivePilotSub = row.pilotSub?.trim() || currentPilotSub || "";

      const missionRef = isProjectRequirementRequest(row.requestRef)
        ? row.requestRef.trim()
        : missionRequestRefForSave(row.requestRef);
      const ownerFields = missionOwnerFieldsForRequestRef(row.requestRef);
      const ownerDisplay =
        ownerFields.userName || ownerFields.userEmail
          ? {
              userName: ownerFields.userName || "—",
              userEmail: ownerFields.userEmail || "—",
            }
          : { userName: "—", userEmail: "—" };

      try {
        sessionStorage.setItem(
          COMPLETED_MISSION_PREVIEW_KEY,
          JSON.stringify({
            missionId: row.requestRef,
            pilotSub: effectivePilotSub,
            assignedAt: row.assignedAt,
            completedAt: new Date().toISOString(),
            userName: ownerDisplay.userName,
            userEmail: ownerDisplay.userEmail,
            customer: row.customer,
            service: row.service,
            dropoff: row.dropoff,
            pilot: row.pilotName,
            droneUnit: row.droneModel,
            status: "completed",
          })
        );
      } catch {
        /* ignore */
      }

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
        const failHref = isProjectRequirementRequest(row.requestRef)
          ? "/pilot-dashboard/completed-projects"
          : "/pilot-dashboard/completed-deliveries";
        alert(
          isProjectRequirementRequest(row.requestRef)
            ? "Could not save mission to database. Redirecting to Completed Project."
            : "Could not save mission to database. Redirecting to Completed Deliveries."
        );
        router.push(failHref);
        return;
      }

      if (effectivePilotSub) {
        await incrementPilotMissionsCompleted(effectivePilotSub, 1);
      }

      notifyMissionsDbUpdated();
      if (isProjectRequirementRequest(row.requestRef)) {
        notifyProjectRequestsUpdated();
      }

      updateUserMissionTrackingStatusToCompleted(row.requestRef);

      setCompletedMissionIds((prev) => {
        const newSet = new Set(prev).add(row.id);
        try {
          localStorage.setItem(
            "aerolaminar_completed_mission_ids",
            JSON.stringify([...newSet])
          );
        } catch {
          /* ignore */
        }
        return newSet;
      });

      if (!row.id.startsWith("db:")) {
        removePilotMissionNotificationById(row.id);
      }
      await loadFromApi();
      setLocalVers((v) => v + 1);
      router.push(
        isProjectRequirementRequest(row.requestRef)
          ? "/pilot-dashboard/completed-projects"
          : "/pilot-dashboard/completed-deliveries"
      );
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
            aria-label="Mission assignment summary"
          >
            <UserRequestStatCard
              label="Total Mission"
              value={stats.total}
              icon={ClipboardList}
              iconClassName="text-[#008B8B]"
              iconWrapClassName="bg-[#008B8B]/10"
            />
            <UserRequestStatCard
              label="Assigned Missions"
              value={stats.assigned}
              icon={Plane}
              iconClassName="text-[#008B8B]"
              iconWrapClassName="bg-[#008B8B]/10"
            />
            <UserRequestStatCard
              label="Completed Mission"
              value={stats.completed}
              icon={CheckCircle2}
              iconClassName="text-sky-800"
              iconWrapClassName="bg-sky-100"
            />
          </section>
        </header>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground dark:border-white/20">
              Loading assigned missions...
            </div>
          ) : rows.length === 0 ? (
            <article className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm sm:p-10">
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B]">
                <Plane className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">
                No assigned missions yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                When an admin assigns you a delivery mission, it will appear here
                with request details, destination, and actions to add notes or mark
                complete.
              </p>
            </article>
          ) : (
            rows.map((row) => {
              const savedComments = loadPilotMissionComments(row.requestRef);
              const isCompleted = completedMissionIds.has(row.id);

              return (
                <AssignedMissionCard
                  key={`${row.id}-${commentsDisplayVers}`}
                  row={row}
                  isCompleted={isCompleted}
                  isSaving={savingRowId === row.id}
                  savedComments={savedComments}
                  deletingCommentAt={deletingCommentAt}
                  onOpenComments={() => openCommentsDialog(row)}
                  onDeleteComment={(createdAt) => void deleteComment(row, createdAt)}
                  onComplete={() => void handleCompletedMission(row)}
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
          aria-labelledby="pilot-comments-dialog-title"
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
                id="pilot-comments-dialog-title"
                className="text-base font-bold text-foreground"
              >
                Mission comments
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {commentsForRow.customer || "Mission"} · {commentsForRow.requestRef}
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-6">
              {dialogComments.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Comments
                  </p>
                  <ul className="space-y-2">
                    {dialogComments.map((comment, index) => {
                      const timestamp = formatCommentTimestamp(comment.createdAt);
                      const isDeleting = deletingCommentAt === comment.createdAt;
                      return (
                        <li
                          key={`${comment.createdAt}-${index}`}
                          className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground">
                              {comment.text}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                commentsForRow
                                  ? void deleteComment(commentsForRow, comment.createdAt)
                                  : undefined
                              }
                              disabled={Boolean(deletingCommentAt) || commentSaving}
                              aria-label="Delete comment"
                              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="size-3" aria-hidden />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                          {timestamp ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {timestamp}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <label
                htmlFor="pilot-mission-comment"
                className="mb-2 block text-xs font-semibold text-muted-foreground"
              >
                Add a comment
              </label>
              <textarea
                id="pilot-mission-comment"
                rows={5}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a new comment..."
                className="w-full resize-y rounded-lg border border-border !bg-transparent px-3 py-2 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:border-[#008B8B] focus:bg-transparent focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setCommentsForRow(null)}
                className="rounded-lg border border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => void addCommentInDialog()}
                disabled={commentSaving || !commentDraft.trim()}
                className="rounded-lg border border-[#008B8B] bg-transparent px-4 py-2 text-xs font-semibold text-[#008B8B] transition-colors hover:bg-[#008B8B]/10 disabled:opacity-50 dark:border-primary dark:text-primary dark:hover:bg-primary/10"
              >
                {commentSaving ? "Adding..." : "Add comment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NoSSR>
  );
}
