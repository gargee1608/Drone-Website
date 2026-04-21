"use client";

import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  Smartphone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginMode = "admin" | "user";
type UserAuthMethod = "password" | "otp";

function isEmailOrPhone(value: string) {
  const v = value.trim();
  if (emailPattern.test(v)) return true;
  const digits = v.replace(/\D/g, "");
  return digits.length === 10;
}

function validateAdmin(identity: string, password: string) {
  const errors: { identity?: string; password?: string } = {};
  const id = identity.trim();
  const pw = password.trim();

  if (!id) errors.identity = "Email is required.";
  else if (!emailPattern.test(id)) errors.identity = "Enter a valid email address.";

  if (!pw) errors.password = "Password is required.";

  return errors;
}

function validateUserPassword(identity: string, password: string) {
  const errors: { identity?: string; password?: string } = {};
  const id = identity.trim();
  const pw = password.trim();

  if (!id) errors.identity = "Email or mobile number is required.";
  else if (!isEmailOrPhone(id)) errors.identity = "Enter a valid email or 10-digit mobile number.";

  if (!pw) errors.password = "Password is required.";

  return errors;
}

function validateUserOtp(identity: string, otp: string, otpSent: boolean) {
  const errors: { identity?: string; otp?: string } = {};
  const id = identity.trim();
  const digits = otp.replace(/\D/g, "");

  if (!id) errors.identity = "Email or mobile number is required.";
  else if (!isEmailOrPhone(id)) errors.identity = "Enter a valid email or 10-digit mobile number.";

  if (!otpSent) {
    errors.otp = "Tap Send OTP first, then enter the code.";
  } else if (digits.length < 4 || digits.length > 6) {
    errors.otp = "Enter the 4–6 digit OTP.";
  }

  return errors;
}

export function LoginView() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("admin");
  const [userAuthMethod, setUserAuthMethod] = useState<UserAuthMethod>("password");
  const [remember, setRemember] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<{
    identity?: string;
    password?: string;
    otp?: string;
  }>({});
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "user" && userAuthMethod === "otp" && otpSent) {
      otpInputRef.current?.focus();
    }
  }, [mode, userAuthMethod, otpSent]);

  const signInWithBackend = async (emailRaw: string, passRaw: string) => {
    const email = emailRaw.trim().toLowerCase();
    const password = passRaw.trim();

    const res = await fetch(apiUrl("/api/auth/signin"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const raw = await res.text();
    let data: {
      token?: string;
      role?: string;
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

    localStorage.setItem("token", data.token);
    if (data.role === "admin") {
      router.push("/dashboard");
    } else {
      router.push("/user-dashboard");
    }
  };

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
                />
              </div>
            </div>
            <h1 className={cn("mb-1.5", ADMIN_PAGE_TITLE_CLASS)}>
              Welcome Back
            </h1>
            <div
              className="mb-1.5 flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
              role="tablist"
              aria-label="Login type"
            >
              <button
                type="button"
                role="tab"
                id="login-tab-admin"
                aria-selected={mode === "admin"}
                aria-controls="login-panel"
                tabIndex={mode === "admin" ? 0 : -1}
                onClick={() => {
                  setMode("admin");
                  setOtp("");
                  setOtpSent(false);
                  setErrors({});
                }}
                className={cn(
                  "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:px-2.5 sm:text-sm",
                  mode === "admin"
                    ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                    : "text-[#414755] hover:text-[#191c1d]"
                )}
              >
                Admin Login
              </button>
              <button
                type="button"
                role="tab"
                id="login-tab-user"
                aria-selected={mode === "user"}
                aria-controls="login-panel"
                tabIndex={mode === "user" ? 0 : -1}
                onClick={() => {
                  setMode("user");
                  setOtp("");
                  setOtpSent(false);
                  setErrors({});
                }}
                className={cn(
                  "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:px-2.5 sm:text-sm",
                  mode === "user"
                    ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                    : "text-[#414755] hover:text-[#191c1d]"
                )}
              >
                User Login
              </button>
            </div>
            <p
              id="login-panel"
              role="tabpanel"
              aria-labelledby={
                mode === "admin" ? "login-tab-admin" : "login-tab-user"
              }
              className="text-xs font-medium leading-snug text-[#414755] sm:text-sm"
            >
              {mode === "admin" ? "Admin dashboard" : "User Dashboard"}
            </p>
          </div>
<form
  className="space-y-2 sm:space-y-2.5"
  noValidate
  onSubmit={async (e) => {
    e.preventDefault();

    // ✅ USER OTP FLOW (no backend)
    if (mode === "user" && userAuthMethod === "otp") {
      const next = validateUserOtp(identity, otp, otpSent);
      setErrors(next);
      if (Object.keys(next).length > 0) return;

      router.push("/user-dashboard");
      return;
    }

    // ✅ ADMIN LOGIN (API: test@gmail.com / test123 → token + role)
    if (mode === "admin") {
      const next = validateAdmin(identity, password);
      setErrors(next);
      if (Object.keys(next).length > 0) return;

      try {
        await signInWithBackend(identity, password);
      } catch (error) {
        console.error(error);
        const detail =
          error instanceof Error ? error.message : "Unknown network error";
        alert(
          `Could not reach the API (${detail}). Start the backend: cd backend && node server.js`
        );
      }

      return;
    }

    // ✅ USER PASSWORD: same backend when signing in with an email (e.g. test@gmail.com)
    const next = validateUserPassword(identity, password);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const id = identity.trim();
    if (emailPattern.test(id)) {
      try {
        await signInWithBackend(id, password);
      } catch (error) {
        console.error(error);
        const detail =
          error instanceof Error ? error.message : "Unknown network error";
        alert(
          `Could not reach the API (${detail}). Start the backend: cd backend && node server.js`
        );
      }
      return;
    }

    router.push("/user-dashboard");
  }}
>
            {mode === "user" ? (
              <div
                className="flex w-full rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
                role="tablist"
                aria-label="User sign-in method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={userAuthMethod === "password"}
                  tabIndex={userAuthMethod === "password" ? 0 : -1}
                  onClick={() => {
                    setUserAuthMethod("password");
                    setOtp("");
                    setOtpSent(false);
                    setErrors({});
                  }}
                  className={cn(
                    "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:text-sm",
                    userAuthMethod === "password"
                      ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                      : "text-[#414755] hover:text-[#191c1d]"
                  )}
                >
                  Password
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={userAuthMethod === "otp"}
                  tabIndex={userAuthMethod === "otp" ? 0 : -1}
                  onClick={() => {
                    setUserAuthMethod("otp");
                    setPassword("");
                    setOtp("");
                    setOtpSent(false);
                    setErrors({});
                  }}
                  className={cn(
                    "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:text-sm",
                    userAuthMethod === "otp"
                      ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                      : "text-[#414755] hover:text-[#191c1d]"
                  )}
                >
                  OTP
                </button>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label
                htmlFor="login-identity"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                {mode === "user" && userAuthMethod === "otp"
                  ? "Email or mobile"
                  : mode === "admin"
                    ? "Email address"
                    : "Email or mobile"}
              </label>
              <div className="relative">
                {mode === "admin" ? (
                  <Mail
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                ) : (
                  <Smartphone
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                )}
                <input
                  id="login-identity"
                  name="identity"
                  type={mode === "admin" ? "email" : "text"}
                  autoComplete={mode === "admin" ? "email" : "username"}
                  placeholder={
                    mode === "admin"
                      ? "you@company.com"
                      : "email or 10-digit mobile"
                  }
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (errors.identity)
                      setErrors((p) => ({ ...p, identity: undefined }));
                  }}
                  aria-invalid={errors.identity ? true : undefined}
                  aria-describedby={
                    errors.identity ? "login-identity-error" : undefined
                  }
                  className={cn(
                    "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                    errors.identity
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-slate-500"
                  )}
                />
              </div>
              {errors.identity ? (
                <p
                  id="login-identity-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                >
                  {errors.identity}
                </p>
              ) : null}
            </div>

            {mode === "user" && userAuthMethod === "otp" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-md border border-slate-300 bg-white py-2 text-xs font-semibold text-[#191c1d] shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:text-sm"
                  onClick={() => {
                    setOtpSent(true);
                    if (errors.otp)
                      setErrors((p) => ({ ...p, otp: undefined }));
                  }}
                >
                  Send OTP
                </button>
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-otp"
                    className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
                  >
                    OTP code
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                      aria-hidden
                    />
                    <input
                      ref={otpInputRef}
                      id="login-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (errors.otp)
                          setErrors((p) => ({ ...p, otp: undefined }));
                      }}
                      aria-invalid={errors.otp ? true : undefined}
                      aria-describedby={
                        errors.otp ? "login-otp-error" : undefined
                      }
                      className={cn(
                        "w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-colors focus:outline-none focus:ring-0 sm:py-2.5 sm:pl-10",
                        errors.otp
                          ? "border-red-500 focus:border-red-500"
                          : "focus:border-slate-500"
                      )}
                    />
                  </div>
                  {errors.otp ? (
                    <p
                      id="login-otp-error"
                      role="alert"
                      className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                    >
                      {errors.otp}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
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
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby={
                        errors.password ? "login-password-error" : undefined
                      }
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
                      id="login-password-error"
                      role="alert"
                      className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                  <div className="flex justify-end px-1">
                    <a
                      href="#"
                      className="text-[11px] font-semibold text-[#008B8B] transition-colors hover:text-[#006b6b] sm:text-xs"
                    >
                      Forgot?
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-1">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border border-slate-300 bg-white text-[#008B8B] focus:outline-none focus:ring-0 sm:size-[18px]"
                  />
                  <label
                    htmlFor="login-remember"
                    className="cursor-pointer text-xs font-medium text-[#414755] sm:text-sm"
                  >
                    Remember me
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#008B8B] to-[#006b6b] py-2 px-3 text-sm font-bold text-white shadow-md shadow-[#008B8B]/20 transition-all hover:shadow-[#008B8B]/35 active:scale-[0.99] sm:py-2.5"
              )}
            >
              {mode === "admin"
                ? "Sign in to Admin Dashboard"
                : "Sign in to User Dashboard"}
              <ArrowRight className="size-3.5 sm:size-4" />
            </button>
          </form>

          <div className="mt-3 text-center sm:mt-4">
            <p className="text-xs font-medium text-[#414755] sm:text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="ml-1 font-bold text-[#008B8B] hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
