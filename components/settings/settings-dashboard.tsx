"use client";

import {
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminProfileView } from "@/components/dashboard/admin-profile-view";
import { PilotProfileView } from "@/components/pilot-registration/pilot-profile-view";
import { UserProfileView } from "@/components/user-dashboard/user-profile-view";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { ADMIN_DASH_STAT_CARD_SURFACE } from "@/lib/admin-dashboard-styles";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/components/theme-provider";
import { PROFILE_INFO_POPUP_SHELL_CLASS } from "@/lib/profile-popup-styles";

function Switch({
  checked,
  onCheckedChange,
  className,
  uncheckedClassName,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
  uncheckedClassName?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008B8B]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked
          ? "bg-[#008B8B]"
          : cn("bg-muted-foreground/35", uncheckedClassName),
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-white shadow-sm transition-transform dark:bg-black",
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
  const { theme, setTheme } = useAppTheme();
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

  const [profileInfoPopupOpen, setProfileInfoPopupOpen] = useState(false);

  /** Profile shortcuts: `/settings?from=â€¦#account-change-password` opens this dialog. */
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
    if (!profileInfoPopupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProfileInfoPopup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileInfoPopupOpen, closeProfileInfoPopup]);

  const settingsSectionClass = cn(
    "flex h-full flex-col rounded-xl bg-card p-5 sm:p-6",
    ADMIN_DASH_STAT_CARD_SURFACE
  );
  const settingsSectionDividerClass = cn(
    "mt-auto space-y-4 border-t pt-4",
    settingsContext === "admin"
      ? "border-[#c1c7cf]/30 dark:border-white/[0.08]"
      : "border-border"
  );
  const settingsGridClass = cn(
    "grid grid-cols-1 items-stretch gap-6",
    settingsContext === "user"
      ? "md:grid-cols-2 xl:grid-cols-3"
      : "lg:grid-cols-3"
  );
  const profileDescription =
    settingsContext === "admin"
      ? "View your admin profile, photo, address, and account details."
      : settingsContext === "pilot"
        ? "View your pilot profile, photo, flight details, and drones."
        : "View your profile page, photo, and account details.";
  const isAdminSettings = settingsContext === "admin";
  const appearanceSwitchUncheckedClass = isAdminSettings
    ? "bg-[#c1c6d7] dark:bg-neutral-600"
    : undefined;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl antialiased">
        <div className={settingsGridClass}>
          {settingsContext === "user" ||
          settingsContext === "admin" ||
          settingsContext === "pilot" ? (
            <section className={settingsSectionClass}>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#008B8B]/12">
                  <UserRound className="size-5 text-[#008B8B]" aria-hidden />
                </span>
                <div className="min-w-0 text-left">
                  <h2 className="text-base font-bold text-foreground">
                    Profile
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {profileDescription}
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
                  className={settingsSectionClass}
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

                {/* Appearance */}
                <section className={settingsSectionClass}>
                  <div className="mb-5 flex items-start gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50"
                      aria-hidden
                    >
                      <Sun className="size-[1.125rem] text-amber-500" />
                      <Moon className="size-[1.125rem] text-violet-600 dark:text-violet-400" />
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
                  <div className={settingsSectionDividerClass}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sun
                          className="size-4 shrink-0 text-amber-500"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Light mode
                      </span>
                      <Switch
                        checked={theme === "light"}
                        uncheckedClassName={appearanceSwitchUncheckedClass}
                        onCheckedChange={(on) => {
                          setTheme(on ? "light" : "dark");
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Moon
                          className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
                          strokeWidth={2}
                          aria-hidden
                        />
                        Dark mode
                      </span>
                      <Switch
                        checked={theme === "dark"}
                        uncheckedClassName={appearanceSwitchUncheckedClass}
                        onCheckedChange={(on) => {
                          setTheme(on ? "dark" : "light");
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
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-white bg-white text-card-foreground shadow-xl ring-1 ring-black/5 dark:border-border dark:bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-20 text-muted-foreground hover:text-foreground"
              aria-label="Close change password"
              onClick={closeChangePassword}
              disabled={passwordSubmitting}
            >
              <X className="size-4" aria-hidden />
            </Button>
            <div className="border-b border-white bg-white px-6 py-5 pr-14 dark:border-border dark:bg-black sm:px-8">
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
              className="bg-white px-6 py-5 dark:bg-black sm:px-8 sm:py-6"
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
                  type="submit"
                  variant="outline"
                  className="rounded-lg border-2 border-[#008B8B] bg-background text-[#008B8B] shadow-none hover:bg-[#008B8B]/8 hover:text-[#008B8B]"
                  disabled={passwordDialogSuccess || passwordSubmitting}
                >
                  {passwordSubmitting ? "Changingâ€¦" : "Change password"}
                </Button>
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
            className={cn(
              "relative z-10 flex w-full flex-col rounded-2xl border-2 border-border shadow-xl ring-1 ring-black/5 dark:ring-white/10",
              PROFILE_INFO_POPUP_SHELL_CLASS,
              settingsContext === "pilot"
                ? "max-w-4xl overflow-visible"
                : "max-h-[min(92dvh,840px)] max-w-2xl overflow-hidden"
            )}
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
            <div
              className={cn(
                "px-3 pb-4 pt-12 sm:px-5 sm:pb-5 sm:pt-14",
                settingsContext === "pilot"
                  ? "min-h-0"
                  : "min-h-0 flex-1 overflow-y-auto overscroll-contain"
              )}
            >
              {settingsContext === "admin" ? (
                <AdminProfileView embedded allowEditWhenEmbedded />
              ) : settingsContext === "pilot" ? (
                <PilotProfileView
                  variant="dashboard"
                  embedded
                  showDroneDetails={false}
                />
              ) : (
                <UserProfileView embedded allowEditWhenEmbedded />
              )}
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}
