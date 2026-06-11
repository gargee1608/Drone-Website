/** Browser draft for `/user-dashboard/profile` (personal fields, not auth secrets). */
export const USER_PROFILE_STORAGE_KEY = "aerolaminar_user_profile_v1";

/** Profile photo saved from Settings → Profile. */
export const USER_PROFILE_PHOTO_STORAGE_KEY = "aerolaminar_user_profile_photo_v1";

/** Dispatched after Settings → Reset profile saves so the profile page can refresh. */
export const USER_PROFILE_UPDATED_EVENT = "aerolaminar-user-profile-updated";

export function readUserProfilePhoto(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(USER_PROFILE_PHOTO_STORAGE_KEY);
  return saved && saved.startsWith("data:image/") ? saved : null;
}

export function saveUserProfilePhoto(dataUrl: string): void {
  if (typeof window === "undefined") return;
  if (!dataUrl.startsWith("data:image/")) return;
  localStorage.setItem(USER_PROFILE_PHOTO_STORAGE_KEY, dataUrl);
  window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
}

export function removeUserProfilePhoto(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_PROFILE_PHOTO_STORAGE_KEY);
  window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
}
