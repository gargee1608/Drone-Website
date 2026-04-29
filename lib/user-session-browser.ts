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
