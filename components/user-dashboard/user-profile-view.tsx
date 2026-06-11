"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";

import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import {
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT,
  readUserProfilePhoto,
  saveUserProfilePhoto,
} from "@/lib/user-profile-storage";
import {
  readStoredUserSession,
  splitDisplayNameToFirstLast,
  writeStoredUserSession,
} from "@/lib/user-session-browser";
import {
  PROFILE_INFO_POPUP_INPUT_CLASS,
  PROFILE_INFO_POPUP_PANEL_CLASS,
} from "@/lib/profile-popup-styles";
import {
  USER_DASH_BORDER_COLOR,
  USER_DASH_DIVIDER_BORDER,
  USER_DASH_INPUT_BORDER,
  USER_DASH_PANEL_BORDER,
} from "@/lib/user-dashboard-styles";
import { cn } from "@/lib/utils";

type UserProfileDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
};

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

export type UserProfileViewProps = {
  /** When true, render only profile content (e.g. inside a settings modal). */
  embedded?: boolean;
  /** When true, allow inline editing even when embedded (for settings popup). */
  allowEditWhenEmbedded?: boolean;
};

export function UserProfileView({ embedded = false, allowEditWhenEmbedded = false }: UserProfileViewProps) {
  const [profile, setProfile] = useState<UserProfileDraft>(DEFAULT_USER_PROFILE);
  const [personalDraft, setPersonalDraft] = useState<UserProfileDraft>(DEFAULT_USER_PROFILE);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [roleLabel, setRoleLabel] = useState("User");
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      const merged = buildProfileFromSessionAndSaved();
      setProfile(merged);
      setPersonalDraft(merged);

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
      const savedAvatar = readUserProfilePhoto();
      if (savedAvatar) {
        setAvatarSrc(savedAvatar);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const next = buildProfileFromSessionAndSaved();
      setProfile(next);
      setPersonalDraft((prev) => (editingPersonal ? prev : next));
    };
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, sync);
  }, [editingPersonal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncPhoto = () => {
      setAvatarSrc(readUserProfilePhoto());
    };
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, syncPhoto);
    return () => window.removeEventListener(USER_PROFILE_UPDATED_EVENT, syncPhoto);
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
      saveUserProfilePhoto(result);
    };
    reader.readAsDataURL(file);
  }

  function onPersonalEditStart() {
    setPersonalDraft(profile);
    setEditingPersonal(true);
  }

  function onPersonalSave() {
    const next = personalDraft;
    setProfile(next);
    setPersonalDraft(next);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next));
      
      // Update user session if needed
      const session = readStoredUserSession();
      if (session) {
        const fullName = `${next.firstName} ${next.lastName}`.trim();
        writeStoredUserSession({
          ...session,
          fullName: fullName,
          name: fullName,
          email: next.email,
          phone: next.phone,
        });
      }
    }
    
    setEditingPersonal(false);
    window.dispatchEvent(new Event(USER_PROFILE_UPDATED_EVENT));
  }

  function onPersonalCancel() {
    setPersonalDraft(profile);
    setEditingPersonal(false);
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = `${profile.firstName.trim().charAt(0)}${profile.lastName
    .trim()
    .charAt(0)}`
    .toUpperCase()
    .replace(/[^A-Z]/g, "") || "UA";

  if (!hydrated) {
    const loading = (
      <div
        className={
          embedded
            ? "px-4 py-12 text-center text-sm text-muted-foreground"
            : "mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500"
        }
      >
        Loading profile…
      </div>
    );
    if (embedded) return loading;
    return (
      <UserDashboardShell pageTitle="Profile" pageTitleBarClassName="text-xs">
        {loading}
      </UserDashboardShell>
    );
  }

  const allowInlineEdit = !embedded || allowEditWhenEmbedded;
  const panelClass = embedded
    ? PROFILE_INFO_POPUP_PANEL_CLASS
    : cn("rounded-xl bg-card px-5 py-4", USER_DASH_PANEL_BORDER);
  const panelClassLg = embedded
    ? `${PROFILE_INFO_POPUP_PANEL_CLASS} p-5 sm:p-6`
    : cn("rounded-xl bg-card p-5 sm:p-6", USER_DASH_PANEL_BORDER);
  const inputClass = embedded
    ? PROFILE_INFO_POPUP_INPUT_CLASS
    : cn(
        "mt-1 w-full rounded-md bg-input px-2.5 py-2 text-xs text-foreground outline-none focus:border-[#f29b38]",
        USER_DASH_INPUT_BORDER
      );

  const body = (
    <>
      <article className={cn(panelClass, "px-5 py-4")}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <div
              className={cn(
                "flex size-16 items-center justify-center overflow-hidden rounded-full bg-card text-lg font-bold text-foreground",
                USER_DASH_BORDER_COLOR
              )}
            >
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
            {allowInlineEdit ? (
              <>
                <button
                  type="button"
                  onClick={onAvatarPick}
                  className={cn(
                    "absolute -bottom-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-muted",
                    USER_DASH_BORDER_COLOR
                  )}
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
              </>
            ) : null}
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

        <article className={panelClassLg}>
          <div
            className={cn(
              "mb-4 flex pb-3",
              USER_DASH_DIVIDER_BORDER,
              allowInlineEdit ? "items-center justify-between" : ""
            )}
          >
            <h2 className="text-lg font-semibold text-[#004444] dark:text-white">
              Personal Information
            </h2>
            {allowInlineEdit ? (
              editingPersonal ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPersonalCancel}
                    className={cn(
                      "inline-flex items-center rounded-md bg-card px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted",
                      USER_DASH_BORDER_COLOR
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onPersonalSave}
                    className={cn(
                      "inline-flex items-center rounded-md bg-card px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted",
                      USER_DASH_BORDER_COLOR
                    )}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onPersonalEditStart}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted",
                    USER_DASH_BORDER_COLOR
                  )}
                >
                  Edit
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              )
            ) : null}
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
                {editingPersonal && allowInlineEdit ? (
                  <input
                    value={personalDraft[key]}
                    onChange={(e) =>
                      setPersonalDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className={inputClass}
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-foreground dark:text-foreground">
                    {profile[key]}
                  </p>
                )}
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
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4 px-1 py-1 sm:px-2">{body}</div>
    );
  }

  return (
    <UserDashboardShell pageTitle="Profile" pageTitleBarClassName="text-xs">
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-8">{body}</div>
    </UserDashboardShell>
  );
}
