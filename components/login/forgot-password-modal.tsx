"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";

import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ForgotPasswordAccountRole = "user" | "pilot" | "admin";

type Step = "email" | "otp" | "newPassword" | "done";

export function ForgotPasswordModal({
  open,
  onClose,
  initialEmail = "",
  role,
}: {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
  role: ForgotPasswordAccountRole;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail(initialEmail.trim().toLowerCase());
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setNote("");
    setLoading(false);
  }, [open, initialEmail]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sendOtp = useCallback(async () => {
    const normalized = email.trim().toLowerCase();
    if (!emailPattern.test(normalized)) {
      setNote("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setNote("");
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password-send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, role }),
      });
      const body = await readResponseJson(res);
      if (!body.okParse) {
        setNote("Invalid server response.");
        return;
      }
      const payload = body.data as { message?: string } | null;
      const msg =
        payload && typeof payload === "object" && "message" in payload
          ? String(payload.message ?? "")
          : "";
      if (!res.ok) {
        setNote(msg || "Could not send OTP.");
        return;
      }
      setStep("otp");
      setNote("Check your inbox (Mailtrap) for the 6-digit code.");
    } catch {
      setNote("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [email, role]);

  const verifyOtp = useCallback(async () => {
    const digits = otp.replace(/\D/g, "");
    if (digits.length !== 6) {
      setNote("Enter the 6-digit OTP from your email.");
      return;
    }
    const normalized = email.trim().toLowerCase();
    setLoading(true);
    setNote("");
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password-verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          role,
          otp: digits,
        }),
      });
      const body = await readResponseJson(res);
      if (!body.okParse) {
        setNote("Invalid server response.");
        return;
      }
      const data =
        body.data && typeof body.data === "object" && body.data !== null
          ? (body.data as { resetToken?: string; message?: string })
          : {};
      if (!res.ok || !data.resetToken) {
        setNote(data.message || "Invalid or expired OTP.");
        return;
      }
      setResetToken(data.resetToken);
      setStep("newPassword");
      setNote("");
    } catch {
      setNote("Could not verify OTP.");
    } finally {
      setLoading(false);
    }
  }, [email, role, otp]);

  const submitNewPassword = useCallback(async () => {
    if (newPassword.length < 8) {
      setNote("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setNote("Passwords do not match.");
      return;
    }
    setLoading(true);
    setNote("");
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password-complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });
      const body = await readResponseJson(res);
      if (!body.okParse) {
        setNote("Invalid server response.");
        return;
      }
      const data =
        body.data && typeof body.data === "object" && body.data !== null
          ? (body.data as { message?: string })
          : {};
      if (!res.ok) {
        setNote(data.message || "Could not update password.");
        return;
      }
      setStep("done");
    } catch {
      setNote("Could not update password.");
    } finally {
      setLoading(false);
    }
  }, [resetToken, newPassword, confirmPassword]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={
        step === "newPassword"
          ? "Set new password"
          : step === "done"
            ? "Password updated"
            : "Forgot your password"
      }
      onClick={onClose}
    >
      <div
        className="w-full max-w-[min(100%,22rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:max-w-md sm:p-5 dark:border-white/15 dark:bg-[#161a1d]"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "done" ? (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Password Updated
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              You can sign in with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] sm:text-sm"
            >
              Back To Login
            </button>
          </>
        ) : step === "newPassword" ? (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Set new password
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              Choose a new password for{" "}
              <span className="font-semibold text-[#191c1d] dark:text-white">
                {email.trim().toLowerCase()}
              </span>
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="forgot-new-password"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#0c4a6e] dark:text-teal-200/90"
                >
                  New password
                </label>
                <input
                  id="forgot-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (note) setNote("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none ring-[#008B8B]/25 transition focus:ring-2 sm:text-sm dark:border-white/15 dark:bg-[#111315] dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="forgot-confirm-password"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#0c4a6e] dark:text-teal-200/90"
                >
                  Confirm password
                </label>
                <input
                  id="forgot-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (note) setNote("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none ring-[#008B8B]/25 transition focus:ring-2 sm:text-sm dark:border-white/15 dark:bg-[#111315] dark:text-white"
                />
              </div>
            </div>
            {note ? (
              <p
                className={cn(
                  "mt-2 text-[11px] font-semibold sm:text-xs",
                  note.toLowerCase().includes("match") ||
                    note.toLowerCase().includes("characters")
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-white/75"
                )}
              >
                {note}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={submitNewPassword}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Back To Login
              </button>
            </div>
          </>
        ) : step === "otp" ? (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Enter verification code
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              We sent a 6-digit OTP to your email. Enter it below to continue.
            </p>
            <div className="mt-5">
              <label
                htmlFor="forgot-otp"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#0c4a6e] dark:text-teal-200/90"
              >
                OTP code
              </label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (note) setNote("");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs tracking-widest text-[#191c1d] outline-none ring-[#008B8B]/25 transition focus:ring-2 sm:text-sm dark:border-white/15 dark:bg-[#111315] dark:text-white"
                placeholder="000000"
              />
            </div>
            {note ? (
              <p
                className={cn(
                  "mt-2 text-[11px] font-semibold sm:text-xs",
                  note.toLowerCase().includes("invalid") ||
                    note.toLowerCase().includes("could not")
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-emerald-700 dark:text-emerald-300/90"
                )}
              >
                {note}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={verifyOtp}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <div className="mt-3 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={sendOtp}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Resend OTP
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Back To Login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Forgot your password
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              Please enter the email address you&apos;d like your password reset
              information sent to
            </p>
            <div className="mt-5">
              <label
                htmlFor="forgot-reset-email"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#0c4a6e] dark:text-teal-200/90"
              >
                Enter email address
              </label>
              <input
                id="forgot-reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (note) setNote("");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none ring-[#008B8B]/25 transition focus:ring-2 sm:text-sm dark:border-white/15 dark:bg-[#111315] dark:text-white"
                placeholder="name@example.com"
              />
            </div>
            {note ? (
              <p
                className={cn(
                  "mt-2 text-[11px] font-semibold sm:text-xs",
                  note.toLowerCase().includes("valid") ||
                    note.toLowerCase().includes("network") ||
                    note.toLowerCase().includes("account")
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-white/75"
                )}
              >
                {note}
              </p>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={sendOtp}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Sending…" : "Request reset link"}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Back To Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
