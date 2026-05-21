/**
 * Event fired when pilots or drones are updated from the Admin Dashboard.
 * This allows the Assign To view to refresh without requiring a page reload.
 */
export const ADMIN_FLEET_UPDATED_EVENT = "aerolaminar-admin-fleet-updated";

const BROADCAST_NAME = "aerolaminar-admin-fleet";

/**
 * Dispatch the admin fleet updated event to notify listeners (e.g., Assign To view).
 */
export function notifyAdminFleetUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(ADMIN_FLEET_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
  try {
    const bc = new BroadcastChannel(BROADCAST_NAME);
    bc.postMessage({ type: "updated" } as const);
    bc.close();
  } catch {
    /* ignore */
  }
}

export function subscribeAdminFleetUpdated(onUpdate: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => onUpdate();
  window.addEventListener(ADMIN_FLEET_UPDATED_EVENT, handler);
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_NAME);
    bc.onmessage = () => onUpdate();
  } catch {
    /* ignore */
  }
  return () => {
    window.removeEventListener(ADMIN_FLEET_UPDATED_EVENT, handler);
    bc?.close();
  };
}
