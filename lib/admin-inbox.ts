import { loadContactInquiries } from "@/lib/contact-inquiries";
import {
  loadUserRequests,
  loadUserRequestsForCurrentUser,
} from "@/lib/user-requests";

export const ADMIN_INBOX_SEEN_KEYS_STORAGE_KEY =
  "aerolaminar_admin_inbox_seen_keys_v1";

/** Admin command center vs signed-in app user (header bell on `/user-dashboard`). */
export type AdminInboxAudience = "admin" | "user";

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

export function buildAdminInboxRows(
  audience: AdminInboxAudience = "admin"
): AdminInboxRow[] {
  const rows: AdminInboxRow[] = [];

  if (audience === "admin") {
    for (const r of loadUserRequests()) {
      if (r.adminStatus !== "pending") continue;
      rows.push({
        key: `admin:ur:${r.id}`,
        kind: "user_request",
        createdAt: r.createdAt,
        sourceLabel: "User Dashboard",
        title: r.reasonOrTitle.trim() || "Mission request",
        subtitle: userRequestSubtitle(r),
        href: `/dashboard/assign?focus=${encodeURIComponent(r.id)}`,
      });
    }

    for (const c of loadContactInquiries()) {
      rows.push({
        key: `admin:ci:${c.id}`,
        kind: "contact",
        createdAt: c.createdAt,
        sourceLabel: "Contact Us",
        title: c.fullName,
        subtitle: previewMessage(c.message, c.email),
        href: `/dashboard/contact-inquiries?id=${encodeURIComponent(c.id)}`,
      });
    }
  } else {
    for (const r of loadUserRequestsForCurrentUser()) {
      if (r.adminStatus === "pending") continue;
      rows.push({
        key: `user:ur:${r.id}:${r.adminStatus}`,
        kind: "user_request",
        createdAt: r.createdAt,
        sourceLabel: userRequestStatusLabel(r.adminStatus),
        title: r.reasonOrTitle.trim() || "Mission request",
        subtitle: userRequestSubtitle(r),
        href: `/user-dashboard/my-requests?id=${encodeURIComponent(r.id)}`,
      });
    }
  }

  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return rows;
}

function userRequestStatusLabel(status: string): string {
  switch (status) {
    case "accepted":
      return "Request accepted";
    case "rejected":
      return "Request rejected";
    case "completed":
      return "Delivery completed";
    default:
      return "Request update";
  }
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
  return [route, meta].filter(Boolean).join(" · ") || "Pending";
}

function previewMessage(message: string, email: string): string {
  const m = message.replace(/\s+/g, " ").trim();
  const short = m.length > 100 ? `${m.slice(0, 100)}…` : m;
  return short ? `${email} — ${short}` : email;
}

export function countUnreadAdminInbox(
  audience: AdminInboxAudience = "admin"
): number {
  const seen = loadSeenKeys();
  return buildAdminInboxRows(audience).filter((r) => !seen.has(r.key)).length;
}

/** Rows not yet dismissed in the notifications panel (same basis as the unread badge). */
export function buildUnreadAdminInboxRows(
  audience: AdminInboxAudience = "admin"
): AdminInboxRow[] {
  const seen = loadSeenKeys();
  return buildAdminInboxRows(audience).filter((r) => !seen.has(r.key));
}
