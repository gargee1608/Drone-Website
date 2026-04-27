"use client";

import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirm: string
) {
  const errors: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  } = {};
  const fn = firstName.trim();
  const ln = lastName.trim();
  const e = email.trim();
  const p = password.trim();
  const c = confirm.trim();

  if (!fn) errors.firstName = "First name is required.";
  if (!ln) errors.lastName = "Last name is required.";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-hidden overflow-y-visible bg-background text-foreground">
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
        <div className="login-glass-card relative w-full max-w-[min(100%,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md sm:max-w-[420px] sm:p-5">
          <div className="mb-2 text-center sm:mb-2.5">
            <div className="mb-1.5 flex justify-center sm:mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:size-11">
                <User
                  className="size-[22px] text-[#008B8B] sm:size-6"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
            </div>
            <h1 className={cn("mb-1.5", ADMIN_PAGE_TITLE_CLASS)}>
              Create account
            </h1>
            <p className="text-xs font-medium leading-snug text-[#414755] sm:text-sm">
              Enter your details to register your account
            </p>
          </div>

          <form
            className="space-y-2 sm:space-y-2.5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const next = validateSignup(
                firstName,
                lastName,
                email,
                password,
                confirm
              );
              setErrors(next);
              if (Object.keys(next).length > 0) return;
              router.push("/login");
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-first-name"
                  className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
                >
                  First name
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                  <input
                    id="signup-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName)
                        setErrors((p) => ({ ...p, firstName: undefined }));
                    }}
                    aria-invalid={errors.firstName ? true : undefined}
                    aria-describedby={
                      errors.firstName ? "signup-first-name-error" : undefined
                    }
                    className={cn(
                      "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                      errors.firstName
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-slate-500"
                    )}
                  />
                </div>
                {errors.firstName ? (
                  <p
                    id="signup-first-name-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                  >
                    {errors.firstName}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-last-name"
                  className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
                >
                  Last name
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                  <input
                    id="signup-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName)
                        setErrors((p) => ({ ...p, lastName: undefined }));
                    }}
                    aria-invalid={errors.lastName ? true : undefined}
                    aria-describedby={
                      errors.lastName ? "signup-last-name-error" : undefined
                    }
                    className={cn(
                      "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                      errors.lastName
                        ? "border-red-500 focus:border-red-500"
                        : "focus:border-slate-500"
                    )}
                  />
                </div>
                {errors.lastName ? (
                  <p
                    id="signup-last-name-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                  >
                    {errors.lastName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                  aria-hidden
                />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
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
                    "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-slate-500"
                  )}
                />
              </div>
              {errors.email ? (
                <p
                  id="signup-email-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
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
                    "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-slate-500"
                  )}
                />
              </div>
              {errors.password ? (
                <p
                  id="signup-password-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
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
                    "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                    errors.confirm
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-slate-500"
                  )}
                />
              </div>
              {errors.confirm ? (
                <p
                  id="signup-confirm-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                >
                  {errors.confirm}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#008B8B] to-[#006b6b] py-2 px-3 text-sm font-bold text-white shadow-md shadow-[#008B8B]/20 transition-all hover:shadow-[#008B8B]/35 active:scale-[0.99] sm:py-2.5"
              )}
            >
              Create account
              <ArrowRight className="size-3.5 sm:size-4" aria-hidden />
            </button>
          </form>

          <div className="mt-3 text-center sm:mt-4">
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
