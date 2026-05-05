"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import {
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT,
} from "@/lib/user-profile-storage";
import {
  readStoredUserSession,
  splitDisplayNameToFirstLast,
} from "@/lib/user-session-browser";

type UserProfileDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
};

const USER_PROFILE_PHOTO_STORAGE_KEY = "aerolaminar_user_profile_photo_v1";

const DEFAULT_USER_PROFILE: UserProfileDraft = {
  firstName: "User",
  lastName: "Account",
  email: "user@example.com",
  phone: "+91 90000 00000",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
};

function readSavedUserProfile(): UserProfileDraft | null {
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

/** Profile row data: signed-in user identity + saved extras when emails match. */
function buildProfileFromSessionAndSaved(): UserProfileDraft {
  const session = readStoredUserSession();
  const saved = readSavedUserProfile();

  if (!session) {
    return saved ?? DEFAULT_USER_PROFILE;
  }

  const email = String(session.email ?? "").trim();
  const display = String(session.fullName ?? session.name ?? "").trim();
  const { firstName: splitFirst, lastName } =
    splitDisplayNameToFirstLast(display);
  let firstName = splitFirst;
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

export function UserProfileView() {
  const [profile, setProfile] = useState<UserProfileDraft>(DEFAULT_USER_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [roleLabel, setRoleLabel] = useState("User");
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      const merged = buildProfileFromSessionAndSaved();
      setProfile(merged);

      const token = localStorage.getItem("token");
      const session = readStoredUserSession();
      const roleFromSession =
        typeof session?.role === "string" && session.role.trim()
          ? session.role
          : null;
      const tokenRole = token ? jwtPayloadRole(token) : null;
      const rawRole = roleFromSession ?? tokenRole;
      if (rawRole) {
        setRoleLabel(
          rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
        );
      }
      const savedAvatar = localStorage.getItem(USER_PROFILE_PHOTO_STORAGE_KEY);
      if (savedAvatar) {
        setAvatarSrc(savedAvatar);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      setProfile(buildProfileFromSessionAndSaved());
    };
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, sync);
  }, []);

  function onAvatarPick() {
    avatarInputRef.current?.click();
  }

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setAvatarSrc(result);
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_PROFILE_PHOTO_STORAGE_KEY, result);
      }
    };
    reader.readAsDataURL(file);
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = `${profile.firstName.trim().charAt(0)}${profile.lastName
    .trim()
    .charAt(0)}`
    .toUpperCase()
    .replace(/[^A-Z]/g, "") || "UA";

  if (!hydrated) {
    return (
      <UserDashboardShell pageTitle="Profile" pageTitleBarClassName="text-xs">
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">
          Loading profile…
        </div>
      </UserDashboardShell>
    );
  }

  return (
    <UserDashboardShell pageTitle="Profile" pageTitleBarClassName="text-xs">
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-8">
        <article className="rounded-xl border border-[#dfe6ea] bg-white px-5 py-4 shadow-sm dark:border-white/15 dark:bg-[#111315]">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-[#d4dce1] bg-white text-lg font-bold text-[#1f3e42] dark:border-white/20 dark:bg-[#161a1d] dark:text-white">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={onAvatarPick}
                className="absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full border border-[#d9dee3] bg-white text-[#2e4f53] shadow-sm transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                aria-label="Edit profile photo"
              >
                <Pencil className="size-3" aria-hidden />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#033f3f] dark:text-white">
                {fullName || "User"}
              </p>
              <p className="text-xs font-medium text-[#1f4d4d] dark:text-white/80">
                {roleLabel}
              </p>
              <p className="text-xs text-[#6a7d81] dark:text-white/65">
                {profile.city}, {profile.country}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6ea] bg-white p-5 shadow-sm dark:border-white/15 dark:bg-[#111315] sm:p-6">
          <div className="mb-4 border-b border-[#edf2f5] pb-3 dark:border-white/15">
            <h2 className="text-lg font-semibold text-[#004444] dark:text-white">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["First Name", "firstName"],
                ["Last Name", "lastName"],
                ["Email", "email"],
                ["Phone", "phone"],
                ["City", "city"],
                ["State", "state"],
                ["Country", "country"],
              ] as const
            ).map(([label, key]) => (
              <div key={key}>
                <p className="text-[11px] text-[#6a7d81] dark:text-white/65">{label}</p>
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">
                  {profile[key]}
                </p>
              </div>
            ))}
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">User Role</p>
              <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">
                {roleLabel}
              </p>
            </div>
          </div>
        </article>

      </div>
    </UserDashboardShell>
  );
}
