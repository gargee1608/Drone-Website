import { apiUrl } from "@/lib/api-url";

/**
 * @returns {Promise<unknown[] | null>} Pilot rows from `GET /api/pilots`, or `null` if the request failed.
 * A **502** from the app usually means the Next proxy could not reach Express (backend not running or wrong `BACKEND_URL`).
 */
export const getPilots = async () => {
  try {
    const response = await fetch(apiUrl("/api/pilots"), {
      cache: "no-store",
    });
    if (!response.ok) {
      let hint = "";
      try {
        const errBody = await response.json();
        if (typeof errBody?.hint === "string") hint = errBody.hint;
        else if (typeof errBody?.detail === "string") hint = errBody.detail;
      } catch {
        /* ignore non-JSON error bodies */
      }
      const suffix = hint ? ` — ${hint}` : "";
      console.error(
        "Failed to fetch pilots:",
        response.status,
        response.status === 502
          ? "Backend unreachable (start Express on port 4000 or set BACKEND_URL)."
          : suffix || ""
      );
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
};

/** @param {string | number} id */
export const getPilotById = async (id) => {
  try {
    const response = await fetch(apiUrl(`/api/pilots/${id}`), {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
};

/** Sync flight hours on the `pilots` row (used by dashboard / profile from API). */
export const patchPilotFlightHours = async (id, flightHours) => {
  try {
    const response = await fetch(apiUrl(`/api/pilots/${id}/details`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightHours }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Patch pilot details failed:", error);
    return null;
  }
};

/** Sync drone details from Pilot Profile into `pilots.drone_details` JSON column. */
export const patchPilotDroneDetails = async (id, drones) => {
  try {
    const response = await fetch(apiUrl(`/api/pilots/${id}/drones`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drones }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Patch pilot drone details failed:", error);
    return null;
  }
};

export const updatePilotStatus = async (id, dutyStatus) => {
  try {
    const response = await fetch(apiUrl(`/api/pilots/${id}/status`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dutyStatus }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Status update failed:", error);
    return null;
  }
};

/** @param {number} [delta] */
export const incrementPilotMissionsCompleted = async (id, delta = 1) => {
  try {
    const response = await fetch(
      apiUrl(`/api/pilots/${id}/missions/increment`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      }
    );
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Mission increment failed:", error);
    return null;
  }
};

export const saveCompletedMission = async (payload) => {
  try {
    const response = await fetch(apiUrl("/api/missions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Save completed mission failed:", error);
    return null;
  }
};

/** Matching Hub: assign a listing to a pilot (`status: assigned`). */
export const assignHubMissionToPilot = async (payload) => {
  try {
    const response = await fetch(apiUrl("/api/missions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, status: "assigned" }),
    });
    if (!response.ok) {
      let detail = "";
      try {
        const errBody = await response.json();
        if (typeof errBody?.error === "string") detail = errBody.error;
      } catch {
        /* ignore */
      }
      return { ok: false, status: response.status, detail };
    }
    const body = await response.json();
    return { ok: true, ...body };
  } catch (error) {
    console.error("assignHubMissionToPilot failed:", error);
    return { ok: false, detail: "Network error" };
  }
};

/** Completed missions for this pilot (`missions` with status completed, by `pilot_sub`). */
export const getPilotCompletedDeliveriesCount = async (pilotSub) => {
  if (!pilotSub) return null;
  try {
    const q = new URLSearchParams({ pilotSub: String(pilotSub) });
    const response = await fetch(
      apiUrl(`/api/missions/completed-deliveries-count?${q.toString()}`),
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.success || typeof body.count !== "number") return null;
    return Math.max(0, Math.floor(body.count));
  } catch (error) {
    console.error("getPilotCompletedDeliveriesCount failed:", error);
    return null;
  }
};

/** Lifetime count of mission rows for this pilot (`missions.pilot_sub`). */
export const getPilotAssignedMissionCount = async (pilotSub) => {
  if (!pilotSub) return null;
  try {
    const q = new URLSearchParams({ pilotSub: String(pilotSub) });
    const response = await fetch(
      apiUrl(`/api/missions/assigned-count?${q.toString()}`),
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.success || typeof body.count !== "number") return null;
    return Math.max(0, Math.floor(body.count));
  } catch (error) {
    console.error("getPilotAssignedMissionCount failed:", error);
    return null;
  }
};

/** Active assignments for the pilot workspace (not completed). */
export const getPilotPendingMissionAssignments = async (pilotSub) => {
  if (!pilotSub) return null;
  try {
    const q = new URLSearchParams({ pilotSub: String(pilotSub) });
    const response = await fetch(
      apiUrl(`/api/missions/pending-assignments?${q.toString()}`),
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.success || !Array.isArray(body.data)) return null;
    return body.data;
  } catch (error) {
    console.error("getPilotPendingMissionAssignments failed:", error);
    return null;
  }
};