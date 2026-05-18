import { clearStoredUserSession } from "@/lib/user-session-browser";

/** Clears JWT and app user/pilot session data from localStorage (browser only). */
export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("pilot");
    clearStoredUserSession();
  } catch {
    /* ignore */
  }
}
