"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";

import {
  ADMIN_PROFILE_STORAGE_KEY,
  ADMIN_PROFILE_UPDATED_EVENT,
  DEFAULT_ADMIN_PROFILE,
  readSavedAdminProfile,
  type AdminProfileDraft,
} from "@/lib/admin-profile-storage";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const DEFAULT_PROFILE = DEFAULT_ADMIN_PROFILE;

export function AdminProfileView() {
  const [profile, setProfile] = useState<AdminProfileDraft>(DEFAULT_PROFILE);
  const [personalDraft, setPersonalDraft] = useState<AdminProfileDraft>(DEFAULT_PROFILE);
  const [addressDraft, setAddressDraft] = useState<AdminProfileDraft>(DEFAULT_PROFILE);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedProfile = readSavedAdminProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      setPersonalDraft(savedProfile);
      setAddressDraft(savedProfile);
      setHasSavedProfile(true);
    }
    const saved = localStorage.getItem("admin_profile_photo");
    if (saved) setAvatarSrc(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSavedProfile) return;
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    const tokenRole = jwtPayloadRole(token);
    if (!tokenRole) return;
    const nextRole =
      tokenRole === "admin"
        ? "Admin"
        : tokenRole.charAt(0).toUpperCase() + tokenRole.slice(1);
    setProfile((prev) => ({ ...prev, userRole: nextRole }));
    setPersonalDraft((prev) => ({ ...prev, userRole: nextRole }));
    setAddressDraft((prev) => ({ ...prev, userRole: nextRole }));
  }, [hasSavedProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const next = readSavedAdminProfile();
      if (!next) return;
      setProfile(next);
      setPersonalDraft((prev) => (editingPersonal ? prev : next));
      setAddressDraft((prev) => (editingAddress ? prev : next));
      setHasSavedProfile(true);
    };
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, sync);
    return () =>
      window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, sync);
  }, [editingPersonal, editingAddress]);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "—";
  const avatarInitials = (() => {
    const parts = `${profile.firstName} ${profile.lastName}`
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "NA";
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  })();

  function onPersonalEditStart() {
    setPersonalDraft(profile);
    setEditingPersonal(true);
  }

  function onAddressEditStart() {
    setAddressDraft(profile);
    setEditingAddress(true);
  }

  function onPersonalSave() {
    const next = {
      ...profile,
      firstName: personalDraft.firstName,
      lastName: personalDraft.lastName,
      dob: personalDraft.dob,
      email: personalDraft.email,
      phone: personalDraft.phone,
      userRole: personalDraft.userRole,
    };
    setProfile(next);
    setPersonalDraft(next);
    setAddressDraft(next);
    setHasSavedProfile(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(next));
    }
    setEditingPersonal(false);
  }

  function onAddressSave() {
    const next = {
      ...profile,
      country: addressDraft.country,
      city: addressDraft.city,
      postalCode: addressDraft.postalCode,
    };
    setProfile(next);
    setPersonalDraft(next);
    setAddressDraft(next);
    setHasSavedProfile(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(next));
    }
    setEditingAddress(false);
  }

  function onAvatarPick() {
    avatarInputRef.current?.click();
  }

  function onAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setAvatarSrc(result);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_profile_photo", result);
      }
    };
    reader.readAsDataURL(file);
  }

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl pb-10">
        <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "mb-5 text-[#003f3f] dark:text-white")}>My Profile</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "mb-5 text-[#003f3f] dark:text-white")}>My Profile</h1>

      <section className="space-y-4">
        <article className="rounded-xl border border-[#dfe6ea] bg-white px-5 py-4 shadow-sm dark:border-white/15 dark:bg-[#111315]">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d4dce1] bg-white text-xl font-bold text-[#234] dark:border-white/20 dark:bg-[#161a1d] dark:text-white">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarInitials
                )}
              </div>
              <button
                type="button"
                onClick={onAvatarPick}
                className="absolute -bottom-1 -right-1 inline-flex size-7 items-center justify-center rounded-full border border-[#d9dee3] bg-white text-[#2e4f53] shadow-sm transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                aria-label="Edit profile photo"
              >
                <Pencil className="size-3.5" aria-hidden />
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
              <p className="text-lg font-semibold tracking-tight text-[#033f3f] dark:text-white">
                {fullName}
              </p>
              <p className="text-xs font-medium text-[#1f4d4d] dark:text-white/80">{profile.userRole}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6ea] bg-white p-5 shadow-sm sm:p-6 dark:border-white/15 dark:bg-[#111315]">
          <div className="mb-4 flex items-center justify-between border-b border-[#edf2f5] pb-3 dark:border-white/15">
            <h2 className="text-lg font-semibold text-[#004444] dark:text-white">Personal Information</h2>
            {editingPersonal ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPersonal(false)}
                  className="inline-flex items-center rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onPersonalSave}
                  className="inline-flex items-center rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onPersonalEditStart}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
              >
                Edit
                <Pencil className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">First Name</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.firstName}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.firstName}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Last Name</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.lastName}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.lastName}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Date of Birth</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.dob}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, dob: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.dob}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Email Address</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.email}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.email}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Phone Number</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.phone}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.phone}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">User Role</p>
              {editingPersonal ? (
                <input
                  value={personalDraft.userRole}
                  onChange={(e) =>
                    setPersonalDraft((prev) => ({ ...prev, userRole: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.userRole}</p>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6ea] bg-white p-5 shadow-sm sm:p-6 dark:border-white/15 dark:bg-[#111315]">
          <div className="mb-4 flex items-center justify-between border-b border-[#edf2f5] pb-3 dark:border-white/15">
            <h2 className="text-lg font-semibold text-[#004444] dark:text-white">Address</h2>
            {editingAddress ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAddress(false)}
                  className="inline-flex items-center rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onAddressSave}
                  className="inline-flex items-center rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAddressEditStart}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#d9dee3] bg-white px-3 py-1 text-[11px] font-semibold text-[#2e4f53] transition-colors hover:bg-[#f7f9fa] dark:border-white/20 dark:bg-[#161a1d] dark:text-white dark:hover:bg-white/10"
              >
                Edit
                <Pencil className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Country</p>
              {editingAddress ? (
                <input
                  value={addressDraft.country}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.country}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">City</p>
              {editingAddress ? (
                <input
                  value={addressDraft.city}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.city}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#6a7d81] dark:text-white/65">Postal Code</p>
              {editingAddress ? (
                <input
                  value={addressDraft.postalCode}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, postalCode: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-[#d9dee3] bg-white px-2.5 py-2 text-xs text-[#1f3e42] outline-none focus:border-[#f29b38] dark:border-white/20 dark:bg-[#161a1d] dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-[#1f3e42] dark:text-white">{profile.postalCode}</p>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
