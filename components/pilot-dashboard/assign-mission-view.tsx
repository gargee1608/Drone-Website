"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  MessageSquareText,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getPilotPendingMissionAssignments,
  incrementPilotMissionsCompleted,
  saveCompletedMission,
} from "@/app/services/pilotServices";
import { jwtPayloadSub } from "@/lib/pilot-display-name";
import {
  notificationsVisibleToPilot,
  PILOT_MISSION_NOTIFICATIONS_UPDATED_EVENT,
  removePilotMissionNotificationById,
  type PilotMissionNotification,
} from "@/lib/pilot-mission-notifications";
import { PILOT_PROFILE_UPDATED_EVENT } from "@/lib/pilot-profile-snapshot";
import {
  PILOT_COMMENT_WEATHER_PRESET,
  pilotMissionCommentForDisplay,
} from "@/lib/pilot-mission-comment-display";
import { notifyMissionsDbUpdated } from "@/lib/user-requests";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";
const PILOT_MISSION_COMMENTS_KEY = "aerolaminar_pilot_mission_comments_v1";

function loadPilotMissionCommentText(requestRef: string): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(PILOT_MISSION_COMMENTS_KEY);
    if (!raw) return "";
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return "";
    const row = (parsed as Record<string, unknown>)[requestRef.trim()];
    if (row && typeof row === "object" && "text" in row) {
      return typeof (row as { text: unknown }).text === "string"
        ? (row as { text: string }).text
        : "";
    }
    return "";
  } catch {
    return "";
  }
}

function savePilotMissionCommentText(requestRef: string, text: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = requestRef.trim();
    const raw = localStorage.getItem(PILOT_MISSION_COMMENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const next =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...parsed }
        : {};
    (next as Record<string, { text: string; updatedAt: string }>)[key] = {
      text: text.trim(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PILOT_MISSION_COMMENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
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

export function AssignMissionView() {
  const router = useRouter();
  const [apiRows, setApiRows] = useState<PilotMissionNotification[]>([]);
  const [localVers, setLocalVers] = useState(0);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [commentsForRow, setCommentsForRow] =
    useState<PilotMissionNotification | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  /** Bumps after saving a comment so cards re-read localStorage. */
  const [commentsDisplayVers, setCommentsDisplayVers] = useState(0);

  const rows = useMemo(
    () =>
      mergePilotMissionRows(apiRows, notificationsVisibleToPilot()),
    [apiRows, localVers]
  );

  const loadFromApi = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const sub = token ? jwtPayloadSub(token) : null;
    if (!sub) {
      setApiRows([]);
      return;
    }
    const data = await getPilotPendingMissionAssignments(sub);
    if (!data) {
      setApiRows([]);
      return;
    }
    const mapped = data
      .map((r: Record<string, unknown>) => dbMissionRowToNotification(r))
      .filter((x: PilotMissionNotification | null): x is PilotMissionNotification => x != null);
    setApiRows(mapped);
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
    if (!commentsForRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommentsForRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentsForRow]);

  function openCommentsDialog(row: PilotMissionNotification) {
    setCommentDraft(loadPilotMissionCommentText(row.requestRef));
    setCommentsForRow(row);
  }

  function saveCommentsDialog() {
    if (!commentsForRow) return;
    savePilotMissionCommentText(commentsForRow.requestRef, commentDraft);
    setCommentsForRow(null);
    setCommentsDisplayVers((v) => v + 1);
    try {
      window.dispatchEvent(new Event("aerolaminar-pilot-mission-comment-saved"));
    } catch {
      /* ignore */
    }
  }

  async function handleCompletedMission(row: PilotMissionNotification) {
    if (savingRowId) return;
    setSavingRowId(row.id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const currentPilotSub = token ? jwtPayloadSub(token) : null;
      const effectivePilotSub = row.pilotSub?.trim() || currentPilotSub || "";

      // Keep immediate UI continuity after redirect, even if DB save is still in-flight/fails.
      try {
        sessionStorage.setItem(
          COMPLETED_MISSION_PREVIEW_KEY,
          JSON.stringify({
            missionId: row.requestRef,
            pilotSub: effectivePilotSub,
            assignedAt: row.assignedAt,
            completedAt: new Date().toISOString(),
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
        requestRef: row.requestRef,
        customer: row.customer,
        service: row.service,
        dropoff: row.dropoff,
        pilotName: row.pilotName,
        pilotBadgeId: row.pilotBadgeId,
        pilotSub: effectivePilotSub,
        droneModel: row.droneModel,
        assignedAt: row.assignedAt,
      });

      if (!saveResult?.success) {
        removePilotMissionNotificationById(row.id);
        setLocalVers((v) => v + 1);
        alert("Could not save mission to database. Redirecting to Completed Deliveries.");
        router.push("/pilot-dashboard/completed-deliveries");
        return;
      }

      if (effectivePilotSub) {
        await incrementPilotMissionsCompleted(effectivePilotSub, 1);
      }

      notifyMissionsDbUpdated();

      if (!row.id.startsWith("db:")) {
        removePilotMissionNotificationById(row.id);
      }
      await loadFromApi();
      setLocalVers((v) => v + 1);
      router.push("/pilot-dashboard/completed-deliveries");
    } finally {
      setSavingRowId(null);
    }
  }

  return (
    <section className="space-y-5">
      {rows.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#008B8B]/12 text-[#008B8B]">
              <Plane className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Pilot has been assigned to complete missions
              </p>
              <p className="mt-1 text-xs font-medium text-[#008B8B] dark:text-primary">
                Upcoming Mission...
              </p>
              <p className="mt-4 text-sm text-slate-600 dark:text-white/75">
                No assigned missions yet.
              </p>
            </div>
          </div>
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => {
            const savedComment = loadPilotMissionCommentText(row.requestRef);
            const savedCommentDisplay =
              pilotMissionCommentForDisplay(savedComment);
            return (
            <article
              key={row.id}
              className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#008B8B]">
                    Assigned Mission
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {row.customer || "Mission"}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Assigned
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Request ID:
                  </span>{" "}
                  {row.requestRef}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Service:
                  </span>{" "}
                  {row.service || "—"}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Drone:
                  </span>{" "}
                  {row.droneModel || "—"}
                </p>
                <p className="text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Assigned At:
                  </span>{" "}
                  {formatAssignedAt(row.assignedAt)}
                </p>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#2d4f53] dark:text-white/85">
                <MapPin className="size-4 text-[#008B8B]" aria-hidden />
                <span>{row.dropoff || "Destination TBD"}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-[#5a6d71] dark:text-white/65">
                <CheckCircle2 className="size-4 text-[#008B8B]" aria-hidden />
                <span>Complete this mission and update delivery status.</span>
              </div>

              {savedCommentDisplay ? (
                <p className="mt-4 text-sm text-[#5a6d71] dark:text-white/75">
                  <span className="font-semibold text-[#1a3e42] dark:text-white">
                    Comment:{" "}
                  </span>
                  <span className="whitespace-pre-wrap">{savedCommentDisplay}</span>
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openCommentsDialog(row)}
                  disabled={savingRowId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#008B8B] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#008B8B] transition-colors hover:bg-[#008B8B]/10 disabled:opacity-50 dark:text-primary dark:hover:bg-primary/15"
                >
                  <MessageSquareText className="size-3.5" aria-hidden />
                  Comments
                </button>
                <button
                  type="button"
                  onClick={() => void handleCompletedMission(row)}
                  disabled={savingRowId === row.id}
                  className="inline-flex items-center rounded-md border border-emerald-600 bg-transparent px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  {savingRowId === row.id ? "Saving..." : "Completed Mission"}
                </button>
              </div>
            </article>
            );
          })}
        </div>
      )}

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
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2
                id="pilot-comments-dialog-title"
                className="text-base font-bold text-foreground"
              >
                Comments
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {commentsForRow.customer || "Mission"} ·{" "}
                {commentsForRow.requestRef}
              </p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <label
                htmlFor="pilot-mission-comment"
                className="mb-2 block text-xs font-semibold text-muted-foreground"
              >
                Your comment
              </label>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Comments:{" "}
                <button
                  type="button"
                  className="font-medium text-[#008B8B] underline decoration-[#008B8B]/40 underline-offset-2 hover:decoration-[#008B8B] dark:text-primary"
                  onClick={() =>
                    setCommentDraft(PILOT_COMMENT_WEATHER_PRESET)
                  }
                >
                  {PILOT_COMMENT_WEATHER_PRESET}
                </button>
              </p>
              <textarea
                id="pilot-mission-comment"
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
                onClick={saveCommentsDialog}
                className="rounded-md border-2 border-[#008B8B] bg-transparent px-4 py-2 text-xs font-semibold text-[#008B8B] transition-colors hover:bg-[#008B8B]/10 dark:text-primary dark:border-primary dark:hover:bg-primary/15"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setCommentsForRow(null)}
                className="rounded-md border border-border bg-transparent px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
