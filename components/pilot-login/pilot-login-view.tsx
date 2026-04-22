"use client";

import Link from "next/link";
import { Lock, Mail, Plane } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePilotLogin(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  const e = email.trim().toLowerCase();
  const pw = password.trim();
  if (!e) errors.email = "Email is required.";
  else if (!emailPattern.test(e)) errors.email = "Enter a valid email address.";
  if (!pw) errors.password = "Password is required.";
  return errors;
}

export function PilotLoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNote, setResetNote] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validatePilotLogin(email, password);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: "pilot",
        }),
      });

      const raw = await res.text();
      let data: {
        token?: string;
        role?: string;
        user?: { role?: string };
        message?: string;
        error?: string;
        detail?: string;
        hint?: string;
      } = {};

      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            data = parsed as typeof data;
          }
        } catch {
          alert("Invalid server response");
          return;
        }
      }

      if (!res.ok || !data.token) {
        const fromProxy = [data.error, data.detail, data.hint]
          .filter(Boolean)
          .join(" — ");
        alert(data.message || fromProxy || "Login failed");
        return;
      }

      const resolvedRole = data.role ?? data.user?.role;
      if (resolvedRole !== "pilot") {
        alert("This account is not registered as a pilot.");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/pilot-dashboard");
    } catch (err) {
      console.error(err);
      const detail =
        err instanceof Error ? err.message : "Could not reach the server.";
      alert(detail);
    } finally {
      setSubmitting(false);
    }
  }

  function submitResetRequest() {
    const normalized = resetEmail.trim().toLowerCase();
    if (!emailPattern.test(normalized)) {
      setResetNote("Please enter a valid email address.");
      return;
    }
    setResetNote("Reset link request submitted.");
  }

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-hidden overflow-y-visible bg-background text-foreground">
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
        <div className="login-glass-card relative w-full max-w-[min(100%,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md sm:max-w-[420px] sm:p-5">
          <div className="mb-2 text-center sm:mb-2.5">
            <div className="mb-1.5 flex justify-center sm:mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:size-11">
                <Plane
                  className="size-[22px] text-[#008B8B] sm:size-6"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
            </div>
            <h1
              className={cn(
                ADMIN_PAGE_TITLE_CLASS,
                "text-center text-xl sm:text-2xl"
              )}
            >
              Pilot login
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/75">
              Sign in to open your pilot dashboard.
            </p>
          </div>

          <form className="mt-4 space-y-3 sm:space-y-4" noValidate onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="pilot-login-email"
                className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 dark:text-white/70"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="pilot-login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-[#191c1d] outline-none ring-[#008B8B]/25 transition placeholder:text-slate-400 focus:ring-2 dark:bg-[#161a1d] dark:text-white",
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-200 dark:border-white/15"
                  )}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "pilot-login-email-err" : undefined
                  }
                />
              </div>
              {errors.email ? (
                <p id="pilot-login-email-err" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="pilot-login-password"
                className="mb-1 block text-xs font-semibold tracking-wide text-slate-600 dark:text-white/70"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="pilot-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-[#191c1d] outline-none ring-[#008B8B]/25 transition placeholder:text-slate-400 focus:ring-2 dark:bg-[#161a1d] dark:text-white",
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-200 dark:border-white/15"
                  )}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "pilot-login-password-err" : undefined
                  }
                />
              </div>
              {errors.password ? (
                <p
                  id="pilot-login-password-err"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.password}
                </p>
              ) : null}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#008B8B] underline-offset-2 hover:underline"
                  onClick={() => {
                    setResetEmail(email.trim().toLowerCase());
                    setResetNote("");
                    setForgotOpen(true);
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006f6f] disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in to pilot dashboard"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-600 dark:text-white/65">
            <Link
              href="/pilot-registration"
              className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
            >
              New Pilot Register
            </Link>
          </p>
        </div>
      </main>
      {forgotOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Forgot your password"
        >
          <div className="w-full max-w-[360px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5 dark:border-white/15 dark:bg-[#161a1d]">
            <h2 className="text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl dark:text-white">
              Forgot your password
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-600 sm:text-sm dark:text-white/75">
              Please enter the email address you&apos;d like your password reset
              information sent to
            </p>

            <div className="mt-5">
              <label
                htmlFor="pilot-reset-email"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-white/70"
              >
                Enter email address
              </label>
              <input
                id="pilot-reset-email"
                type="email"
                value={resetEmail}
                onChange={(ev) => {
                  setResetEmail(ev.target.value);
                  if (resetNote) setResetNote("");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#191c1d] outline-none ring-[#008B8B]/25 transition focus:ring-2 sm:text-sm dark:border-white/15 dark:bg-[#111315] dark:text-white"
                placeholder="name@example.com"
              />
            </div>

            {resetNote ? (
              <p className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-white/75">
                {resetNote}
              </p>
            ) : null}

            <button
              type="button"
              onClick={submitResetRequest}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-2.5 text-xs font-semibold text-white transition hover:bg-[#006f6f] sm:text-sm"
            >
              Request reset link
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-[11px] font-semibold text-[#008B8B] underline-offset-2 hover:underline sm:text-xs"
              >
                Back To Login
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
