import { jwtPayloadRole } from "@/lib/pilot-display-name";

export const ADMIN_PROFILE_STORAGE_KEY = "aerolaminar_admin_profile_v1";
/** Same key as legacy `AdminProfileView` avatar storage. */
export const ADMIN_PROFILE_PHOTO_STORAGE_KEY = "admin_profile_photo";

export const ADMIN_PROFILE_UPDATED_EVENT = "aerolaminar-admin-profile-updated";

export type AdminProfileDraft = {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  userRole: string;
  country: string;
  city: string;
  postalCode: string;
};

export const DEFAULT_ADMIN_PROFILE: AdminProfileDraft = {
  firstName: "Natashia",
  lastName: "Khaleira",
  dob: "12-10-1990",
  email: "info@binary-fusion.com",
  phone: "(+62) 821 2554 - 5846",
  userRole: "Admin",
  country: "United Kingdom",
  city: "Leeds, East London",
  postalCode: "ERT 1254",
};

export function readSavedAdminProfile(): AdminProfileDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminProfileDraft>;
    return { ...DEFAULT_ADMIN_PROFILE, ...parsed };
  } catch {
    return null;
  }
}

function userRoleFromAuthToken(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PROFILE.userRole;
  const token = localStorage.getItem("token");
  const tokenRole = token ? jwtPayloadRole(token) : null;
  if (!tokenRole) return DEFAULT_ADMIN_PROFILE.userRole;
  return tokenRole === "admin"
    ? "Admin"
    : tokenRole.charAt(0).toUpperCase() + tokenRole.slice(1).toLowerCase();
}

/** Same merge as Admin Dashboard → My Profile (saved JSON + JWT role when nothing saved). */
export function buildAdminProfileForDisplay(): AdminProfileDraft {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PROFILE;
  const saved = readSavedAdminProfile();
  if (saved) return saved;
  return { ...DEFAULT_ADMIN_PROFILE, userRole: userRoleFromAuthToken() };
}
