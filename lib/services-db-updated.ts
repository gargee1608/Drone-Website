/**
 * When services are mutated via the admin dashboard (REST `/api/services`),
 * client views that cache the list should refetch. Same-tab updates use a
 * `CustomEvent`; other tabs use `BroadcastChannel` when available.
 */

export const SERVICES_DB_UPDATED_EVENT = "aerolaminar-services-db-updated";

const BROADCAST_NAME = "aerolaminar-services-db";

export function notifyServicesDbUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SERVICES_DB_UPDATED_EVENT));
  try {
    const bc = new BroadcastChannel(BROADCAST_NAME);
    bc.postMessage({ type: "updated" } as const);
    bc.close();
  } catch {
    // BroadcastChannel may be unavailable (privacy mode, old runtimes).
  }
}

/** Subscribe in client components; returns an unsubscribe function. */
export function subscribeServicesDbUpdated(onUpdate: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => {
    onUpdate();
  };
  window.addEventListener(SERVICES_DB_UPDATED_EVENT, handler);
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
    window.removeEventListener(SERVICES_DB_UPDATED_EVENT, handler);
    bc?.close();
  };
}
