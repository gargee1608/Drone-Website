export const CONTACT_INQUIRIES_STORAGE_KEY = "aerolaminar_contact_inquiries_v1";

export const CONTACT_INQUIRIES_UPDATED_EVENT =
  "aerolaminar-contact-inquiries-updated";

export type ContactInquiry = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
};

const MAX_STORED = 200;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isContactInquiry(v: unknown): v is ContactInquiry {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.createdAt === "string" &&
    typeof v.fullName === "string" &&
    typeof v.email === "string" &&
    typeof v.message === "string"
  );
}

export function loadContactInquiries(): ContactInquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTACT_INQUIRIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isContactInquiry);
  } catch {
    return [];
  }
}

function saveContactInquiries(rows: ContactInquiry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CONTACT_INQUIRIES_STORAGE_KEY,
    JSON.stringify(rows.slice(0, MAX_STORED))
  );
}

export function appendContactInquiry(
  payload: Omit<ContactInquiry, "id" | "createdAt">
): ContactInquiry {
  const id = `CI-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const entry: ContactInquiry = {
    id,
    createdAt,
    ...payload,
  };
  const rest = loadContactInquiries();
  saveContactInquiries([entry, ...rest]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONTACT_INQUIRIES_UPDATED_EVENT));
  }
  return entry;
}

export function deleteContactInquiry(id: string): boolean {
  const all = loadContactInquiries();
  const next = all.filter((row) => row.id !== id);
  if (next.length === all.length) return false;
  saveContactInquiries(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONTACT_INQUIRIES_UPDATED_EVENT));
  }
  return true;
}
