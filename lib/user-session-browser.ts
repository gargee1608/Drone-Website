import { jwtPayloadPilotFullName, jwtPayloadRole } from "@/lib/pilot-display-name";

/**
 * Browser session for app user (email/password or phone OTP) — mirrors `pilot` for pilots.
 * Written on successful `/api/auth/signin` or `/api/auth/verify-phone-otp`; cleared on user logout.
 */
export const USER_SESSION_STORAGE_KEY = "aerolaminar_user_session_v1";

export type StoredUserSession = {
  id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  role?: string;
  phone?: string;
};

export function readStoredUserSession(): StoredUserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as StoredUserSession;
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

export function writeStoredUserSession(user: StoredUserSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_SESSION_STORAGE_KEY);
}

/** Display name from JWT, stored session, or profile draft — mirrors pilot dashboard welcome. */
export function getUserDisplayName(token: string | null): string {
  if (typeof window === "undefined") return "User";

  if (token && jwtPayloadRole(token) === "user") {
    const fromJwt = jwtPayloadPilotFullName(token);
    if (fromJwt) return fromJwt;
  }

  const session = readStoredUserSession();
  const fromSession = String(session?.fullName ?? session?.name ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (fromSession) return fromSession;

  try {
    const raw = localStorage.getItem("aerolaminar_user_profile_v1");
    if (raw) {
      const p = JSON.parse(raw) as { firstName?: string; lastName?: string };
      const n = [p.firstName, p.lastName]
        .map((s) => String(s ?? "").trim())
        .filter(Boolean)
        .join(" ");
      if (n) return n;
    }
  } catch {
    /* ignore */
  }

  const em = (session?.email ?? "").trim();
  if (em) return em.split("@")[0] || "User";

  return "User";
}

export function splitDisplayNameToFirstLast(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const t = displayName.replace(/\s+/g, " ").trim();
  if (!t) return { firstName: "", lastName: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { firstName: t, lastName: "" };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1).trim() };
}
