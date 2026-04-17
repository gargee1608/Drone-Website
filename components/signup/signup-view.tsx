"use client";

import Link from "next/link";
import { ArrowRight, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(email: string, password: string, confirm: string) {
  const errors: { email?: string; password?: string; confirm?: string } = {};
  const e = email.trim();
  const p = password.trim();
  const c = confirm.trim();

  if (!e) errors.email = "Email is required.";
  else if (!emailPattern.test(e)) errors.email = "Enter a valid email address.";

  if (!p) errors.password = "Password is required.";
  else if (p.length < 8) errors.password = "Use at least 8 characters.";

  if (!c) errors.confirm = "Confirm your password.";
  else if (p !== c) errors.confirm = "Passwords do not match.";

  return errors;
}

export function SignUpView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-hidden overflow-y-visible bg-background text-foreground">
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-start overflow-x-hidden overflow-y-visible px-4 py-8 pb-12 sm:px-6 sm:py-10 sm:pb-16">
        <div className="login-glass-card relative w-full max-w-[340px] rounded-xl p-5 shadow-lg shadow-[#4d5b7f]/8 sm:max-w-[400px] sm:p-6">
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-1.5 rounded-t-xl bg-gradient-to-r from-[#008B8B] via-[#006b6b] to-[#006195] shadow-[0_2px_10px_rgba(0,88,188,0.35)]"
            aria-hidden
          />

          <div className="mb-4 pt-0.5 text-center sm:mb-5">
            <div className="mb-2.5 flex justify-center sm:mb-3">
              <div className="flex size-11 items-center justify-center rounded-lg border border-[#008B8B]/20 bg-[#008B8B]/10 shadow-sm sm:size-12">
                <User className="size-6 text-[#008B8B] sm:size-7" strokeWidth={1.75} />
              </div>
            </div>
            <h1
              className={cn(
                "mb-1.5 text-xl font-bold tracking-tight text-[#191c1d] sm:text-2xl"
              )}
            >
              Create account
            </h1>
            <p className="text-xs font-medium leading-snug text-[#414755] sm:text-sm">
              Enter your details to register your account
            </p>
          </div>

          <form
            className="space-y-3 sm:space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const next = validateSignup(email, password, confirm);
              setErrors(next);
              if (Object.keys(next).length > 0) return;
              router.push("/login");
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                Email
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                  aria-hidden
                />
                <input
                  id="signup-email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "signup-email-error" : undefined}
                  className={cn(
                    "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                    errors.email
                      ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                      : "focus:ring-[#008B8B]/20"
                  )}
                />
              </div>
              {errors.email ? (
                <p
                  id="signup-email-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-snug text-red-600 sm:text-xs"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                  aria-hidden
                />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "signup-password-error" : undefined}
                  className={cn(
                    "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                    errors.password
                      ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                      : "focus:ring-[#008B8B]/20"
                  )}
                />
              </div>
              {errors.password ? (
                <p
                  id="signup-password-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-snug text-red-600 sm:text-xs"
                >
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                  aria-hidden
                />
                <input
                  id="signup-confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
                  }}
                  aria-invalid={errors.confirm ? true : undefined}
                  aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
                  className={cn(
                    "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                    errors.confirm
                      ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                      : "focus:ring-[#008B8B]/20"
                  )}
                />
              </div>
              {errors.confirm ? (
                <p
                  id="signup-confirm-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-snug text-red-600 sm:text-xs"
                >
                  {errors.confirm}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#008B8B] to-[#006b6b] py-2.5 px-3 text-sm font-bold text-white shadow-md shadow-[#008B8B]/20 transition-all hover:shadow-[#008B8B]/35 active:scale-[0.99] sm:py-3"
              )}
            >
              Create account
              <ArrowRight className="size-3.5 sm:size-4" />
            </button>
          </form>

          <div className="mt-5 text-center sm:mt-6">
            <p className="text-xs font-medium text-[#414755] sm:text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="ml-1 font-bold text-[#008B8B] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
