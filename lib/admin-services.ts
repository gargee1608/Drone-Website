export const ADMIN_SERVICES_STORAGE_KEY = "aerolaminar_admin_services_v1";

export const ADMIN_SERVICES_UPDATED_EVENT = "aerolaminar-admin-services-updated";

export type AdminService = {
  id: string;
  title: string;
  description: string;
  /** Shown like catalog badges, e.g. "$49" or "From $120/h". */
  priceLabel: string;
  createdAt: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isAdminService(v: unknown): v is AdminService {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.priceLabel === "string" &&
    typeof v.createdAt === "number"
  );
}

/** Parse persisted JSON (e.g. from `localStorage`) into validated rows. */
export function parseAdminServicesJsonSnapshot(raw: string): AdminService[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAdminService);
  } catch {
    return [];
  }
}

export function loadAdminServices(): AdminService[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ADMIN_SERVICES_STORAGE_KEY);
  if (!raw) return [];
  return parseAdminServicesJsonSnapshot(raw);
}

export function saveAdminServices(rows: AdminService[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SERVICES_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(ADMIN_SERVICES_UPDATED_EVENT));
}

export function createAdminServiceId(): string {
  return `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
