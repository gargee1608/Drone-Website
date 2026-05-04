import {
  readStoredUserSession,
  splitDisplayNameToFirstLast,
} from "@/lib/user-session-browser";

export const USER_PROFILE_STORAGE_KEY = "aerolaminar_user_profile_v1";
export const USER_PROFILE_PHOTO_STORAGE_KEY = "aerolaminar_user_profile_photo_v1";

/** Dispatched after user profile JSON is saved (Settings reset or legacy profile save). */
export const USER_PROFILE_UPDATED_EVENT = "aerolaminar-user-profile-updated";

export type UserProfileDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
};

export const DEFAULT_USER_PROFILE: UserProfileDraft = {
  firstName: "User",
  lastName: "Account",
  email: "user@example.com",
  phone: "+91 90000 00000",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
};

export function readSavedUserProfile(): UserProfileDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfileDraft>;
    return { ...DEFAULT_USER_PROFILE, ...parsed };
  } catch {
    return null;
  }
}

/** Signed-in user identity + saved extras when emails match (same as User Dashboard → Profile). */
export function buildProfileFromSessionAndSaved(): UserProfileDraft {
  const session = readStoredUserSession();
  const saved = readSavedUserProfile();

  if (!session) {
    return saved ?? DEFAULT_USER_PROFILE;
  }

  const email = String(session.email ?? "").trim();
  const display = String(session.fullName ?? session.name ?? "").trim();
  let { firstName, lastName } = splitDisplayNameToFirstLast(display);
  if (!firstName && email) {
    firstName = email.split("@")[0] || "User";
  }

  const sameSaved =
    saved &&
    email &&
    saved.email.trim().toLowerCase() === email.toLowerCase();

  const phoneFromSession = String(session.phone ?? "").trim();

  return {
    firstName: firstName || "User",
    lastName,
    email: email || DEFAULT_USER_PROFILE.email,
    phone: phoneFromSession || (sameSaved ? saved.phone : ""),
    city: sameSaved ? saved.city : "",
    state: sameSaved ? saved.state : "",
    country: sameSaved ? saved.country : "",
  };
}
