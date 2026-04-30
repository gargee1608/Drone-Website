export const ADMIN_SERVICES_STORAGE_KEY = "aerolaminar_admin_services_v1";

export const ADMIN_SERVICES_UPDATED_EVENT = "aerolaminar-admin-services-updated";

/** Used when no image URL is set (healthcare logistics truck hero). */
export const DEFAULT_ADMIN_SERVICE_IMAGE = "/service-added-default.png";

/** Alt text for the default cover when none is provided. */
export const DEFAULT_ADMIN_SERVICE_IMAGE_ALT =
  "White medical logistics delivery truck on a highway at sunset, with healthcare branding, city skyline and bridge in the distance.";

export type AdminService = {
  id: string;
  title: string;
  description: string;
  /** Shown like catalog badges, e.g. "$49" or "From $120/h". */
  priceLabel: string;
  createdAt: number;
  /** Cover image URL (absolute or under `/public`). */
  image: string;
  imageAlt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseAdminServiceRow(v: unknown): AdminService | null {
  if (!isRecord(v)) return null;
  if (typeof v.id !== "string" || !v.id) return null;
  if (typeof v.title !== "string") return null;
  if (typeof v.description !== "string") return null;
  if (typeof v.priceLabel !== "string") return null;
  if (typeof v.createdAt !== "number" || !Number.isFinite(v.createdAt)) {
    return null;
  }
  const title = v.title;
  const imageRaw = typeof v.image === "string" ? v.image.trim() : "";
  const image = imageRaw || DEFAULT_ADMIN_SERVICE_IMAGE;
  const imageAltRaw = typeof v.imageAlt === "string" ? v.imageAlt.trim() : "";
  const imageAlt = imageAltRaw
    ? imageAltRaw
    : image === DEFAULT_ADMIN_SERVICE_IMAGE
      ? DEFAULT_ADMIN_SERVICE_IMAGE_ALT
      : title.trim() || "Service";
  return {
    id: v.id,
    title,
    description: v.description,
    priceLabel: v.priceLabel,
    createdAt: v.createdAt,
    image,
    imageAlt,
  };
}

/** Parse persisted JSON (e.g. from `localStorage`) into validated rows. */
export function parseAdminServicesJsonSnapshot(raw: string): AdminService[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseAdminServiceRow)
      .filter((row): row is AdminService => row !== null);
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
