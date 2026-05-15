/**
 * Event fired when pilots or drones are updated from the Admin Dashboard.
 * This allows the Assign To view to refresh without requiring a page reload.
 */
export const ADMIN_FLEET_UPDATED_EVENT = "aerolaminar-admin-fleet-updated";

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
}
