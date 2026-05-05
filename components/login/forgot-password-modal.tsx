"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";

import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ForgotPasswordAccountRole = "user" | "pilot" | "admin";

type Step = "email" | "emailSent";

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
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail(initialEmail.trim().toLowerCase());
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

  const sendResetLink = useCallback(async () => {
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
        setNote(msg || "Could not send reset email.");
        return;
      }
      setStep("emailSent");
      setNote(
        "If an account exists for this email, we sent a message with a reset link. Open the link to choose a new password. The link expires in 30 minutes."
      );
    } catch {
      setNote("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [email, role]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={
        step === "emailSent" ? "Check your email" : "Forgot your password"
      }
      onClick={onClose}
    >
      <div
        className="w-full max-w-[min(100%,22rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:max-w-md sm:p-5 dark:border-white/15 dark:bg-[#161a1d]"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "emailSent" ? (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Check your email
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm dark:text-white/75">
              {note}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] sm:text-sm"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Forgot your password
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              Enter your account email. We&apos;ll send you a link to reset your
              password.
            </p>
            <div className="mt-5">
              <label
                htmlFor="forgot-reset-email"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#0c4a6e] dark:text-teal-200/90"
              >
                Email address
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
            {note && step === "email" ? (
              <p
                className={cn(
                  "mt-2 text-[11px] font-semibold sm:text-xs",
                  note.toLowerCase().includes("valid") ||
                    note.toLowerCase().includes("network") ||
                    note.toLowerCase().includes("account") ||
                    note.toLowerCase().includes("could not")
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
              onClick={sendResetLink}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] disabled:opacity-60 sm:text-sm"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
