"use client";

import {
  CheckCircle2,
  Lock,
  Moon,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminProfileView } from "@/components/dashboard/admin-profile-view";
import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";
import { UserProfileView } from "@/components/user-dashboard/user-profile-view";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";
import { activePilotProfileSnapshotStorageKey } from "@/lib/pilot-profile-browser-storage";
import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_UPDATED_EVENT,
} from "@/lib/pilot-profile-snapshot";
import {
  ADMIN_PROFILE_STORAGE_KEY,
  ADMIN_PROFILE_UPDATED_EVENT,
  buildAdminProfileForDisplay,
  readSavedAdminProfile,
} from "@/lib/admin-profile-storage";
import { jwtPayloadRole } from "@/lib/pilot-display-name";
import {
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT,
} from "@/lib/user-profile-storage";
import {
  applyThemeToDocument,
  resolveThemeWithFallback,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/theme";
import {
  readStoredUserSession,
  splitDisplayNameToFirstLast,
  writeStoredUserSession,
} from "@/lib/user-session-browser";

const profileInputClassName =
  "h-10 rounded-lg border-border bg-background text-sm text-foreground";

function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-[#008B8B]" : "bg-muted-foreground/35"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-transform",
          checked ? "translate-x-[1.15rem]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export type SettingsDashboardProps = {
  /** Which shell opened Settings (used for layout context; password change uses JWT role). */
  settingsContext?: "user" | "pilot" | "admin";
};

export function SettingsDashboard({
  settingsContext = "user",
}: SettingsDashboardProps = {}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<AppTheme>("light");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDialogError, setPasswordDialogError] = useState<string | null>(
    null
  );
  const [passwordDialogSuccess, setPasswordDialogSuccess] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPasswordsInChangeDialog, setShowPasswordsInChangeDialog] =
    useState(false);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profileDialogError, setProfileDialogError] = useState<string | null>(
    null
  );
  const [profileDialogSuccess, setProfileDialogSuccess] = useState(false);
  const [profileInfoPopupOpen, setProfileInfoPopupOpen] = useState(false);

  useLayoutEffect(() => {
    const initial = resolveThemeWithFallback();
    setTheme(initial);
    applyThemeToDocument(initial);
  }, []);

  /** Profile shortcuts: `/settings?from=…#account-change-password` opens this dialog. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname?.startsWith("/settings")) return;
    if (window.location.hash !== "#account-change-password") return;
    setPasswordDialogError(null);
    setPasswordDialogSuccess(false);
    setShowPasswordsInChangeDialog(false);
    setChangePasswordOpen(true);
    const { pathname: path, search } = window.location;
    window.history.replaceState(null, "", `${path}${search}`);
  }, [pathname]);

  const setThemeMode = useCallback((next: AppTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyThemeToDocument(next);
  }, []);

  const closeChangePassword = useCallback(() => {
    setChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogError(null);
    setPasswordDialogSuccess(false);
    setPasswordSubmitting(false);
    setShowPasswordsInChangeDialog(false);
  }, []);

  const openProfileDialog = useCallback(() => {
    setProfileDialogError(null);
    setProfileDialogSuccess(false);

    if (settingsContext === "user") {
      const session = readStoredUserSession();
      type SavedProfile = {
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
      };
      let saved: SavedProfile | null = null;
      try {
        const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (raw) saved = JSON.parse(raw) as SavedProfile;
      } catch {
        saved = null;
      }
      const email = String(session?.email ?? "").trim();
      const display = String(
        session?.fullName ?? session?.name ?? ""
      ).trim();
      const { firstName: splitFirst, lastName } =
        splitDisplayNameToFirstLast(display);
      let firstName = splitFirst;
      if (!firstName && email) {
        firstName = email.split("@")[0] || "";
      }
      const sameSaved =
        saved !== null &&
        email &&
        String(saved.email ?? "")
          .trim()
          .toLowerCase() === email.toLowerCase();

      setProfileFullName(`${firstName} ${lastName}`.trim() || display);
      setProfileEmail(email || String(saved?.email ?? "").trim());
      setProfilePhone(
        String(session?.phone ?? "").trim() ||
          (sameSaved && saved ? String(saved.phone ?? "").trim() : "")
      );
      setProfileCity(sameSaved && saved ? String(saved.city ?? "").trim() : "");
      setProfileState(sameSaved && saved ? String(saved.state ?? "").trim() : "");
    } else if (settingsContext === "admin") {
      const merged = buildAdminProfileForDisplay();
      const display =
        `${merged.firstName} ${merged.lastName}`.trim() ||
        merged.email.split("@")[0] ||
        "";
      setProfileFullName(display);
      setProfileEmail(merged.email);
      setProfilePhone(merged.phone);
      setProfileCity(merged.city);
      setProfileState(merged.postalCode);
    } else {
      const existing = parsePilotProfileSnapshot(
        localStorage.getItem(activePilotProfileSnapshotStorageKey())
      );
      setProfileFullName(existing?.fullName ?? "");
      setProfileEmail(
        typeof existing?.email === "string" ? existing.email : ""
      );
      setProfilePhone(
        typeof existing?.phone === "string" ? existing.phone : ""
      );
      setProfileCity(existing?.city ?? "");
      setProfileState(existing?.state ?? "");
    }

    setProfileDialogOpen(true);
  }, [settingsContext]);

  const closeProfileDialog = useCallback(() => {
    setProfileDialogOpen(false);
    setProfileDialogError(null);
    setProfileDialogSuccess(false);
  }, []);

  const openProfileInfoPopup = useCallback(() => {
    setProfileInfoPopupOpen(true);
  }, []);

  const closeProfileInfoPopup = useCallback(() => {
    setProfileInfoPopupOpen(false);
  }, []);

  useEffect(() => {
    if (!passwordDialogSuccess) return;
    const t = window.setTimeout(() => {
      closeChangePassword();
    }, 2200);
    return () => window.clearTimeout(t);
  }, [passwordDialogSuccess, closeChangePassword]);

  useEffect(() => {
    if (!changePasswordOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChangePassword();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changePasswordOpen, closeChangePassword]);

  useEffect(() => {
    if (!profileDialogSuccess) return;
    const t = window.setTimeout(() => {
      closeProfileDialog();
    }, 2200);
    return () => window.clearTimeout(t);
  }, [profileDialogSuccess, closeProfileDialog]);

  useEffect(() => {
    if (!profileDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProfileDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileDialogOpen, closeProfileDialog]);

  useEffect(() => {
    if (!profileInfoPopupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProfileInfoPopup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileInfoPopupOpen, closeProfileInfoPopup]);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl antialiased">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {settingsContext === "user" ? (
            <section className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12">
                  <UserRound className="size-5 text-[#008B8B]" aria-hidden />
                </span>
                <div className="min-w-0 text-left">
                  <h2 className="text-base font-bold text-foreground">
                    Profile
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    View your profile page, photo, and account details.
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-lg border-[#008B8B] bg-background text-sm font-semibold text-[#008B8B] hover:bg-[#008B8B]/8"
                  onClick={openProfileInfoPopup}
                >
                  Profile information
                </Button>
              </div>
            </section>
          ) : null}

          {settingsContext === "admin" ? (
            <section className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12">
                  <UserRound className="size-5 text-[#008B8B]" aria-hidden />
                </span>
                <div className="min-w-0 text-left">
                  <h2 className="text-base font-bold text-foreground">
                    Profile
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    View your admin profile, photo, address, and account
                    details.
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-lg border-[#008B8B] bg-background text-sm font-semibold text-[#008B8B] hover:bg-[#008B8B]/8"
                  onClick={openProfileInfoPopup}
                >
                  Profile information
                </Button>
              </div>
            </section>
          ) : null}

          {settingsContext === "pilot" ? (
            <section className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12">
                  <UserRound className="size-5 text-[#008B8B]" aria-hidden />
                </span>
                <div className="min-w-0 text-left">
                  <h2 className="text-base font-bold text-foreground">
                    Profile
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    View your pilot profile, photo, flight details, and drones.
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-lg border-[#008B8B] bg-background text-sm font-semibold text-[#008B8B] hover:bg-[#008B8B]/8"
                  onClick={openProfileInfoPopup}
                >
                  Profile information
                </Button>
              </div>
            </section>
          ) : null}

                <section
                  id="account-change-password"
                  className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6"
                  data-settings-context={settingsContext}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12">
                      <Lock className="size-5 text-[#008B8B]" aria-hidden />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-foreground">
                        Change password
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        Update your account password for better security
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg border-[#008B8B] bg-background text-sm font-semibold text-[#008B8B] hover:bg-[#008B8B]/8"
                      onClick={() => {
                        setPasswordDialogError(null);
                        setPasswordDialogSuccess(false);
                        setShowPasswordsInChangeDialog(false);
                        setChangePasswordOpen(true);
                      }}
                    >
                      Change password
                    </Button>
                  </div>
                </section>

                {/* Reset Profile */}
                <section className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <RefreshCw
                        className="size-5 text-emerald-600"
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-foreground">
                        Reset Profile Information
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        Open the editor to update your saved profile details
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg border-emerald-600 bg-background text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                      onClick={openProfileDialog}
                    >
                      Reset Profile
                    </Button>
                  </div>
                </section>

                {/* Appearance */}
                <section className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6 md:col-span-2 xl:col-span-1">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Moon className="size-5 text-violet-600" aria-hidden />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-foreground">
                        Appearance
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        Switch between light and dark mode for the whole app.
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto space-y-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        Light Mode
                      </span>
                      <Switch
                        checked={theme === "light"}
                        onCheckedChange={(on) => {
                          setThemeMode(on ? "light" : "dark");
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        Dark Mode
                      </span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(on) => {
                          setThemeMode(on ? "dark" : "light");
                        }}
                      />
                    </div>
                  </div>
                </section>

        </div>
      </div>

      {changePasswordOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-dialog-title"
          aria-describedby="change-password-dialog-desc"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={closeChangePassword}
          />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-border bg-card text-card-foreground shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border bg-muted/50 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12"
                  aria-hidden
                >
                  <Lock className="size-5 text-[#008B8B]" />
                </span>
                <div>
                  <h2
                    id="change-password-dialog-title"
                    className="text-lg font-bold tracking-tight text-foreground"
                  >
                    Change password
                  </h2>
                  <p
                    id="change-password-dialog-desc"
                    className="mt-0.5 text-sm text-muted-foreground"
                  >
                    Enter your current password, then choose a new one.
                  </p>
                </div>
              </div>
            </div>
            <form
              className="px-6 py-5 sm:px-8 sm:py-6"
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                const cur = currentPassword.trim();
                const next = newPassword.trim();
                const confirm = confirmPassword.trim();
                if (!cur || !next || !confirm) {
                  setPasswordDialogError("Please fill in all fields.");
                  setPasswordDialogSuccess(false);
                  return;
                }
                if (next !== confirm) {
                  setPasswordDialogError(
                    "New password and confirmation do not match."
                  );
                  setPasswordDialogSuccess(false);
                  return;
                }
                if (next === cur) {
                  setPasswordDialogError(
                    "New password must be different from your current password."
                  );
                  setPasswordDialogSuccess(false);
                  return;
                }

                setPasswordDialogError(null);
                setPasswordDialogSuccess(false);

                const token =
                  typeof window !== "undefined"
                    ? localStorage.getItem("token")
                    : null;
                if (!token) {
                  setPasswordDialogError("You are not signed in.");
                  return;
                }

                setPasswordSubmitting(true);
                try {
                  const res = await fetch(apiUrl("/api/auth/change-password"), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      currentPassword: cur,
                      newPassword: next,
                    }),
                  });
                  const parsed = await readResponseJson(res);
                  if (!parsed.okParse) {
                    setPasswordDialogError("Invalid server response.");
                    return;
                  }
                  const data = parsed.data as {
                    ok?: boolean;
                    message?: string;
                    signInError?: string;
                  };
                  if (!res.ok) {
                    if (data.signInError === "password") {
                      setPasswordDialogError("Incorrect Password");
                    } else {
                      setPasswordDialogError(
                        String(data.message || "").trim() ||
                          "Could not change password."
                      );
                    }
                    return;
                  }
                  setPasswordDialogSuccess(true);
                } catch {
                  setPasswordDialogError(
                    "Network error. Check your connection and try again."
                  );
                } finally {
                  setPasswordSubmitting(false);
                }
              }}
            >
              {passwordDialogSuccess ? (
                <div
                  className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2
                    className="size-5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold">Updated Successfully</p>
                </div>
              ) : null}
              {passwordDialogError ? (
                <p
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
                  role="alert"
                >
                  {passwordDialogError}
                </p>
              ) : null}
              <div
                className={cn(
                  "space-y-4",
                  passwordDialogSuccess && "pointer-events-none opacity-50"
                )}
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="current-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Current password
                  </label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type={showPasswordsInChangeDialog ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-border bg-background text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    New password
                  </label>
                  <Input
                    id="new-password"
                    name="new-password"
                    type={showPasswordsInChangeDialog ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-border bg-background text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPasswordsInChangeDialog ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-border bg-background text-sm text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2 px-0.5 pt-1">
                  <input
                    id="change-password-show-passwords"
                    type="checkbox"
                    checked={showPasswordsInChangeDialog}
                    onChange={(e) =>
                      setShowPasswordsInChangeDialog(e.target.checked)
                    }
                    disabled={passwordDialogSuccess}
                    className="size-4 shrink-0 rounded border border-slate-300 bg-background text-[#008B8B] focus:outline-none focus:ring-2 focus:ring-[#008B8B]/25 dark:border-white/20 sm:size-[18px]"
                  />
                  <label
                    htmlFor="change-password-show-passwords"
                    className="cursor-pointer text-xs font-medium text-foreground sm:text-sm"
                  >
                    Show passwords
                  </label>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-2 border-border bg-background text-foreground hover:bg-muted/50"
                  onClick={closeChangePassword}
                  disabled={passwordDialogSuccess || passwordSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-lg border-2 border-[#008B8B] bg-background text-[#008B8B] shadow-none hover:bg-[#008B8B]/8 hover:text-[#008B8B]"
                  disabled={passwordDialogSuccess || passwordSubmitting}
                >
                  {passwordSubmitting ? "Changing…" : "Change password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {profileDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-dialog-title"
          aria-describedby="profile-dialog-desc"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={closeProfileDialog}
          />
          <div
            className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-border bg-card text-card-foreground shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-border bg-muted/50 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                  aria-hidden
                >
                  <UserRound className="size-5 text-emerald-600" />
                </span>
                <div>
                  <h2
                    id="profile-dialog-title"
                    className="text-lg font-bold tracking-tight text-foreground"
                  >
                    Profile details
                  </h2>
                  <p
                    id="profile-dialog-desc"
                    className="mt-0.5 text-sm text-muted-foreground"
                  >
                    {settingsContext === "user" ? (
                      <>
                        Update the name, contact, and location shown on your
                        profile page. Your profile photo is still changed from the
                        profile screen.
                      </>
                    ) : settingsContext === "admin" ? (
                      <>
                        Update the name, contact, and location shown on your admin
                        profile page. Your profile photo is still changed from the
                        profile screen.
                      </>
                    ) : (
                      <>
                        Update the name, contact, and location shown on your pilot
                        profile page. Your profile photo and other registration
                        details (skills, drones, license, hours, bio) are still
                        changed from pilot profile or registration.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                const name = profileFullName.trim();
                if (!name) {
                  setProfileDialogError("Please enter your full name.");
                  setProfileDialogSuccess(false);
                  return;
                }

                if (settingsContext === "user") {
                  const session = readStoredUserSession();
                  if (!session) {
                    setProfileDialogError(
                      "Not signed in. Sign in again to update your profile."
                    );
                    setProfileDialogSuccess(false);
                    return;
                  }
                  const { firstName: splitFirst, lastName } =
                    splitDisplayNameToFirstLast(name);
                  let firstName = splitFirst;
                  const email =
                    profileEmail.trim() ||
                    String(session.email ?? "").trim();
                  const phone =
                    profilePhone.trim() ||
                    String(session.phone ?? "").trim();
                  if (!firstName && email) {
                    firstName = email.split("@")[0] || "User";
                  }

                  let country = "";
                  try {
                    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
                    if (raw) {
                      const p = JSON.parse(raw) as { country?: string };
                      if (typeof p.country === "string") country = p.country;
                    }
                  } catch {
                    /* ignore */
                  }
                  if (!country.trim()) country = "India";

                  const draft = {
                    firstName: firstName || "User",
                    lastName,
                    email: email || String(session.email ?? "").trim(),
                    phone,
                    city: profileCity.trim(),
                    state: profileState.trim(),
                    country,
                  };

                  try {
                    localStorage.setItem(
                      USER_PROFILE_STORAGE_KEY,
                      JSON.stringify(draft)
                    );
                    writeStoredUserSession({
                      ...session,
                      fullName: name,
                      name: name,
                      email: draft.email,
                      phone: draft.phone,
                    });
                  } catch {
                    setProfileDialogError("Could not save. Try again.");
                    setProfileDialogSuccess(false);
                    return;
                  }
                  window.dispatchEvent(
                    new Event(USER_PROFILE_UPDATED_EVENT)
                  );
                  setProfileDialogError(null);
                  setProfileDialogSuccess(true);
                  return;
                }

                if (settingsContext === "admin") {
                  const token =
                    typeof window !== "undefined"
                      ? localStorage.getItem("token")
                      : null;
                  if (!token) {
                    setProfileDialogError(
                      "Not signed in. Sign in again to update your profile."
                    );
                    setProfileDialogSuccess(false);
                    return;
                  }
                  if (jwtPayloadRole(token) !== "admin") {
                    setProfileDialogError(
                      "Only an admin session can update this profile."
                    );
                    setProfileDialogSuccess(false);
                    return;
                  }
                  const base =
                    readSavedAdminProfile() ?? buildAdminProfileForDisplay();
                  const { firstName: splitFirst, lastName } =
                    splitDisplayNameToFirstLast(name);
                  let firstName = splitFirst;
                  const email =
                    profileEmail.trim() || String(base.email ?? "").trim();
                  const phone =
                    profilePhone.trim() || String(base.phone ?? "").trim();
                  if (!firstName && email) {
                    firstName = email.split("@")[0] || "Admin";
                  }
                  const next = {
                    ...base,
                    firstName: firstName || "Admin",
                    lastName,
                    email,
                    phone,
                    city: profileCity.trim(),
                    postalCode: profileState.trim(),
                  };
                  try {
                    localStorage.setItem(
                      ADMIN_PROFILE_STORAGE_KEY,
                      JSON.stringify(next)
                    );
                  } catch {
                    setProfileDialogError("Could not save. Try again.");
                    setProfileDialogSuccess(false);
                    return;
                  }
                  window.dispatchEvent(
                    new Event(ADMIN_PROFILE_UPDATED_EVENT)
                  );
                  setProfileDialogError(null);
                  setProfileDialogSuccess(true);
                  return;
                }

                if (settingsContext === "pilot") {
                  const existing = parsePilotProfileSnapshot(
                    localStorage.getItem(activePilotProfileSnapshotStorageKey())
                  );
                  const next = {
                    fullName: name,
                    email: profileEmail.trim() || undefined,
                    phone: profilePhone.trim() || undefined,
                    city: profileCity.trim(),
                    state: profileState.trim(),
                    aadhaar: existing?.aadhaar,
                    flightHours: existing?.flightHours ?? 0,
                    bio: existing?.bio ?? "",
                    skills: existing?.skills ?? [],
                    drones: existing?.drones ?? [],
                    dgca: existing?.dgca ?? "",
                    photoDataUrl: existing?.photoDataUrl,
                  };
                  const json = JSON.stringify(next);
                  try {
                    const sk = activePilotProfileSnapshotStorageKey();
                    localStorage.setItem(sk, json);
                    sessionStorage.setItem(sk, json);
                  } catch {
                    setProfileDialogError("Could not save. Try again.");
                    setProfileDialogSuccess(false);
                    return;
                  }
                  window.dispatchEvent(new Event(PILOT_PROFILE_UPDATED_EVENT));
                  setProfileDialogError(null);
                  setProfileDialogSuccess(true);
                }
              }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
                {profileDialogSuccess ? (
                  <div
                    className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
                    role="status"
                    aria-live="polite"
                  >
                    <CheckCircle2
                      className="size-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <p className="text-sm font-semibold">Profile saved</p>
                  </div>
                ) : null}
                {profileDialogError ? (
                  <p
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
                    role="alert"
                  >
                    {profileDialogError}
                  </p>
                ) : null}
                <div
                  className={cn(
                    "space-y-4",
                    profileDialogSuccess && "pointer-events-none opacity-50"
                  )}
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="profile-full-name"
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Full name
                    </label>
                    <Input
                      id="profile-full-name"
                      name="profile-full-name"
                      autoComplete="name"
                      value={profileFullName}
                      onChange={(e) => {
                        setProfileFullName(e.target.value);
                        setProfileDialogError(null);
                      }}
                      className={profileInputClassName}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-email"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Email
                      </label>
                      <Input
                        id="profile-email"
                        name="profile-email"
                        type="email"
                        autoComplete="email"
                        value={profileEmail}
                        onChange={(e) => {
                          setProfileEmail(e.target.value);
                          setProfileDialogError(null);
                        }}
                        className={profileInputClassName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-phone"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Phone
                      </label>
                      <Input
                        id="profile-phone"
                        name="profile-phone"
                        type="tel"
                        autoComplete="tel"
                        value={profilePhone}
                        onChange={(e) => {
                          setProfilePhone(e.target.value);
                          setProfileDialogError(null);
                        }}
                        className={profileInputClassName}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-city"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        City
                      </label>
                      <Input
                        id="profile-city"
                        name="profile-city"
                        autoComplete="address-level2"
                        value={profileCity}
                        onChange={(e) => {
                          setProfileCity(e.target.value);
                          setProfileDialogError(null);
                        }}
                        className={profileInputClassName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="profile-state"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        {settingsContext === "admin"
                          ? "Postal code"
                          : "State"}
                      </label>
                      <Input
                        id="profile-state"
                        name="profile-state"
                        autoComplete={
                          settingsContext === "admin"
                            ? "postal-code"
                            : "address-level1"
                        }
                        value={profileState}
                        onChange={(e) => {
                          setProfileState(e.target.value);
                          setProfileDialogError(null);
                        }}
                        className={profileInputClassName}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-border bg-card px-6 py-4 sm:px-8">
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-2 border-border bg-background text-foreground hover:bg-muted/50"
                    onClick={closeProfileDialog}
                    disabled={profileDialogSuccess}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="rounded-lg border-2 border-emerald-600 bg-background text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
                    disabled={profileDialogSuccess}
                  >
                    Save profile
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {(settingsContext === "user" ||
        settingsContext === "admin" ||
        settingsContext === "pilot") &&
      profileInfoPopupOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            settingsContext === "admin"
              ? "Admin profile"
              : settingsContext === "pilot"
                ? "Pilot profile"
                : "Profile"
          }
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#191c1d]/35 backdrop-blur-[2px]"
            aria-label="Close profile"
            onClick={closeProfileInfoPopup}
          />
          <div
            className="relative z-10 flex max-h-[min(92dvh,840px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-border bg-card text-card-foreground shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 z-20 text-muted-foreground hover:text-foreground sm:right-2 sm:top-2"
              aria-label="Close"
              onClick={closeProfileInfoPopup}
            >
              <X className="size-4" aria-hidden />
            </Button>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-12 sm:px-5 sm:pb-5 sm:pt-14">
              {settingsContext === "admin" ? (
                <AdminProfileView embedded />
              ) : settingsContext === "pilot" ? (
                <PilotProfileView variant="dashboard" embedded />
              ) : (
                <UserProfileView embedded />
              )}
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}
