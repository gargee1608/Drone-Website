import { loadContactInquiries } from "@/lib/contact-inquiries";
import { loadUserRequests } from "@/lib/user-requests";

export const ADMIN_INBOX_SEEN_KEYS_STORAGE_KEY =
  "aerolaminar_admin_inbox_seen_keys_v1";

export type AdminInboxRow = {
  key: string;
  kind: "user_request" | "contact";
  createdAt: string;
  sourceLabel: string;
  title: string;
  subtitle: string;
  href: string;
};

function loadSeenKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ADMIN_INBOX_SEEN_KEYS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistSeenKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ADMIN_INBOX_SEEN_KEYS_STORAGE_KEY,
      JSON.stringify([...keys])
    );
  } catch {
    /* quota */
  }
}

export function markAdminInboxKeysSeen(keys: string[]): void {
  if (keys.length === 0) return;
  const next = loadSeenKeys();
  for (const k of keys) next.add(k);
  persistSeenKeys(next);
}

export function buildAdminInboxRows(): AdminInboxRow[] {
  const rows: AdminInboxRow[] = [];

  for (const r of loadUserRequests()) {
    if (r.adminStatus !== "pending") continue;
    rows.push({
      key: `ur:${r.id}`,
      kind: "user_request",
      createdAt: r.createdAt,
      sourceLabel: "User Dashboard",
      title: r.reasonOrTitle.trim() || "Mission request",
      subtitle: userRequestSubtitle(r),
      href: "/dashboard/user-requests",
    });
  }

  for (const c of loadContactInquiries()) {
    rows.push({
      key: `ci:${c.id}`,
      kind: "contact",
      createdAt: c.createdAt,
      sourceLabel: "Contact Us",
      title: c.fullName,
      subtitle: previewMessage(c.message, c.email),
      href: "/dashboard/contact-inquiries",
    });
  }

  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return rows;
}

function userRequestSubtitle(r: {
  pickupLocation: string;
  dropLocation: string;
  requestType: string;
  requestPriority: string;
}): string {
  const route = [r.pickupLocation.trim(), r.dropLocation.trim()]
    .filter(Boolean)
    .join(" → ");
  const meta = [r.requestType.trim(), r.requestPriority.trim()]
    .filter(Boolean)
    .join(" · ");
  return [route, meta].filter(Boolean).join(" · ") || "Pending admin review";
}

function previewMessage(message: string, email: string): string {
  const m = message.replace(/\s+/g, " ").trim();
  const short = m.length > 100 ? `${m.slice(0, 100)}…` : m;
  return short ? `${email} — ${short}` : email;
}

export function countUnreadAdminInbox(): number {
  const seen = loadSeenKeys();
  return buildAdminInboxRows().filter((r) => !seen.has(r.key)).length;
}
