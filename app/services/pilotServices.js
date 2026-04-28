import { apiUrl } from "@/lib/api-url";

export const getPilots = async () => {
  try {
    const response = await fetch(apiUrl("/api/pilots"), {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Failed to fetch pilots:", response.status);
      return [];
    }
    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
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