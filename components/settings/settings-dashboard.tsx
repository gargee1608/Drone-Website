"use client";

import {
  CheckCircle2,
  Lock,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
        "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058bc]/40 focus-visible:ring-offset-2",
        checked ? "bg-[#0058bc]" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform",
          checked ? "translate-x-[1.15rem]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function SettingsDashboard() {
  const [mobileSettingsNavOpen, setMobileSettingsNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDialogError, setPasswordDialogError] = useState<string | null>(
    null
  );
  const [passwordDialogSuccess, setPasswordDialogSuccess] = useState(false);

  const closeChangePassword = useCallback(() => {
    setChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogError(null);
    setPasswordDialogSuccess(false);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f1f5f9] text-slate-900">
      <div className="flex items-center gap-2 border-b border-[#e8eaef] bg-[#f8f9fa] px-4 py-2.5 lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-[#eceff1]"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.matchMedia("(min-width: 1024px)").matches
            ) {
              setSidebarCollapsed((c) => !c);
              setMobileSettingsNavOpen(false);
            } else {
              setMobileSettingsNavOpen((o) => !o);
            }
          }}
          aria-label={
            mobileSettingsNavOpen
              ? "Close settings menu"
              : "Open settings menu"
          }
          aria-expanded={mobileSettingsNavOpen}
        >
          {mobileSettingsNavOpen ? (
            <X className="size-5" strokeWidth={2.25} aria-hidden />
          ) : (
            <Menu className="size-5" strokeWidth={2.25} aria-hidden />
          )}
        </button>
        <span className="text-sm font-bold text-slate-900">Settings</span>
      </div>

      {mobileSettingsNavOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Settings sections"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setMobileSettingsNavOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-0 z-40 max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto border-b border-[#e8eaef] bg-[#f8f9fa] px-4 py-4 shadow-lg">
            <div className="flex w-full items-center gap-3 rounded-xl bg-[#0058bc]/12 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15">
              <Shield className="size-[18px] shrink-0 text-[#0058bc]" />
              Profile
            </div>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-[#eceff1]"
              onClick={() => setMobileSettingsNavOpen(false)}
            >
              <LogOut className="size-[18px] text-slate-400" />
              Logout
            </button>
          </nav>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "hidden w-[228px] shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] lg:flex xl:w-64",
            sidebarCollapsed && "lg:hidden"
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 p-3 pt-5" aria-label="Settings sections">
            <div className="flex w-full items-center gap-3 rounded-xl bg-[#0058bc]/12 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15">
              <Shield className="size-[18px] shrink-0 text-[#0058bc]" />
              Profile
            </div>
          </nav>
          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-50"
            >
              <LogOut className="size-[18px] text-slate-400" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-6xl">
              <header className="mb-8 flex items-center gap-3 sm:mb-10">
                <button
                  type="button"
                  className="hidden rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200/60 lg:inline-flex"
                  onClick={() => {
                    setSidebarCollapsed((c) => !c);
                    setMobileSettingsNavOpen(false);
                  }}
                  aria-label={
                    sidebarCollapsed ? "Expand settings sidebar" : "Collapse settings sidebar"
                  }
                  aria-expanded={!sidebarCollapsed}
                >
                  <Menu className="size-5" strokeWidth={2.25} aria-hidden />
                </button>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem] sm:leading-tight">
                  Settings
                </h1>
              </header>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {/* Change Password */}
                <section className="flex flex-col rounded-xl border-2 border-sky-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Lock className="size-5 text-[#0058bc]" aria-hidden />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-slate-900">
                        Change Password
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        Update your account password for better security
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg border-[#0058bc] bg-white text-sm font-semibold text-[#0058bc] hover:bg-sky-50"
                      onClick={() => {
                        setPasswordDialogError(null);
                        setPasswordDialogSuccess(false);
                        setChangePasswordOpen(true);
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                </section>

                {/* Reset Profile */}
                <section className="flex flex-col rounded-xl border-2 border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <RefreshCw
                        className="size-5 text-emerald-600"
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-slate-900">
                        Reset Profile Information
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        Restore your profile details to default settings
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-1 flex-col justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg border-emerald-600 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Reset Profile
                    </Button>
                  </div>
                </section>

                {/* Appearance */}
                <section className="flex flex-col rounded-xl border-2 border-violet-100 bg-white p-5 shadow-sm sm:p-6 md:col-span-2 xl:col-span-1">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Moon className="size-5 text-violet-600" aria-hidden />
                    </span>
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-bold text-slate-900">
                        Appearance
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        Switch between light and dark mode
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">
                        Light Mode
                      </span>
                      <Switch
                        checked={theme === "light"}
                        onCheckedChange={(on) => {
                          setTheme(on ? "light" : "dark");
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">
                        Dark Mode
                      </span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(on) => {
                          setTheme(on ? "dark" : "light");
                        }}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
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
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#c1c6d7] bg-white shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200/80 bg-slate-50/50 px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky-100"
                  aria-hidden
                >
                  <Lock className="size-5 text-[#0058bc]" />
                </span>
                <div>
                  <h2
                    id="change-password-dialog-title"
                    className="text-lg font-bold tracking-tight text-slate-900"
                  >
                    Change password
                  </h2>
                  <p
                    id="change-password-dialog-desc"
                    className="mt-0.5 text-sm text-slate-500"
                  >
                    Enter your current password, then choose a new one.
                  </p>
                </div>
              </div>
            </div>
            <form
              className="px-6 py-5 sm:px-8 sm:py-6"
              onSubmit={(e) => {
                e.preventDefault();
                const cur = currentPassword.trim();
                const next = newPassword.trim();
                const confirm = confirmPassword.trim();
                if (!cur || !next || !confirm) {
                  setPasswordDialogError("Please fill in all fields.");
                  setPasswordDialogSuccess(false);
                  return;
                }
                setPasswordDialogError(null);
                setPasswordDialogSuccess(true);
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
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Current password
                  </label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    New password
                  </label>
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordDialogError(null);
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  onClick={closeChangePassword}
                  disabled={passwordDialogSuccess}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-[#0058bc] text-white hover:bg-[#004a9e]"
                  disabled={passwordDialogSuccess}
                >
                  Update password
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
