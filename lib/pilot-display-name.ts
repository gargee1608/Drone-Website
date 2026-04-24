import { readPilotProfileSnapshotRawFromBrowser } from "@/lib/pilot-profile-browser-storage";
import { parsePilotProfileSnapshot } from "@/lib/pilot-profile-snapshot";

export function jwtPayloadRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { role?: string };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

/** JWT subject — for pilots this is the `pilots.id` from sign-in. */
export function jwtPayloadSub(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { sub?: string };
    const sub = json.sub;
    if (typeof sub !== "string") return null;
    const t = sub.trim();
    return t || null;
  } catch {
    return null;
  }
}

export function jwtPayloadPilotFullName(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as {
      name?: string;
      fullName?: string;
    };
    const n = String(json.fullName ?? json.name ?? "")
      .replace(/\s+/g, " ")
      .trim();
    return n || null;
  } catch {
    return null;
  }
}

/** Full name from login: JWT first, then stored pilot object, then profile draft. */
export function getPilotDisplayName(token: string | null): string {
  if (typeof window === "undefined") return "Pilot";

  if (token) {
    const fromJwt = jwtPayloadPilotFullName(token);
    if (fromJwt) return fromJwt;
  }

  try {
    const raw = localStorage.getItem("pilot");
    if (raw) {
      const p = JSON.parse(raw) as {
        name?: string;
        fullName?: string;
        email?: string;
      };
      const n = String(p.fullName ?? p.name ?? "")
        .replace(/\s+/g, " ")
        .trim();
      if (n) return n;
      const em = (p.email ?? "").trim();
      if (em) return em.split("@")[0] || "Pilot";
    }
  } catch {
    /* ignore */
  }

  try {
    const snap = parsePilotProfileSnapshot(
      readPilotProfileSnapshotRawFromBrowser()
    );
    const n = snap?.fullName?.replace(/\s+/g, " ").trim();
    if (n) return n;
  } catch {
    /* ignore */
  }

  return "Pilot";
}
