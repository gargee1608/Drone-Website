/**
 * When mission_requests rows change in the admin dashboard, client views
 * (e.g. Matching Hub) should refetch from `/api/missions-requests`.
 */

export const MISSION_REQUESTS_UPDATED_EVENT =
  "aerolaminar-mission-requests-updated";

const BROADCAST_NAME = "aerolaminar-mission-requests-db";

export function notifyMissionRequestsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MISSION_REQUESTS_UPDATED_EVENT));
  try {
    const bc = new BroadcastChannel(BROADCAST_NAME);
    bc.postMessage({ type: "updated" } as const);
    bc.close();
  } catch {
    // BroadcastChannel may be unavailable.
  }
}

/** Subscribe in client components; returns an unsubscribe function. */
export function subscribeMissionRequestsUpdated(
  onUpdate: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => {
    onUpdate();
  };
  window.addEventListener(MISSION_REQUESTS_UPDATED_EVENT, handler);
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_NAME);
    bc.onmessage = () => {
      onUpdate();
    };
  } catch {
    // ignore
  }
  return () => {
    window.removeEventListener(MISSION_REQUESTS_UPDATED_EVENT, handler);
    bc?.close();
  };
}
