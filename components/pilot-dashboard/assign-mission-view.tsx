"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Plane, ShieldCheck } from "lucide-react";
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
import { notifyMissionsDbUpdated } from "@/lib/user-requests";

const COMPLETED_MISSION_PREVIEW_KEY = "aerolaminar_completed_mission_preview_v1";

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
      .filter((x): x is PilotMissionNotification => x != null);
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
        <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-white/20 dark:bg-[#111315] sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#008B8B]/12 text-[#008B8B]">
              <Plane className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#003f3f] dark:text-white">
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
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-[#dfe6ea] bg-white p-5 shadow-sm dark:border-white/15 dark:bg-[#111315]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#008B8B]">
                    Assigned Mission
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[#1a3e42] dark:text-white">
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

              <div className="mt-4 flex justify-end">
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
          ))}
        </div>
      )}
    </section>
  );
}
