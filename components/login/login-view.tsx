"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, Lock, Smartphone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const bgImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDkixcfsboUXaEfIaZmoujti7hfSba0B2AfWeflMndcGb2jOOgnw2QOBKTr9fWIegCpdkKJ1FZrznUkySsDuOLxMm7WnBNIc00w63GQI7-vEvhg2Fnu9MOvs4XHMTrpd_MdIYc_3efAvdWdCnePjx3yK7AwsMGTJR8SKL0DspUpBGp2dYRKZ-YY0FPxfIL2EJ3FozIFsKIATIPNiH8uSvJ2X01BdpxCZVaLKNUGF9mjNylsaLhinsE4lDjNsxa681VxlwN6AUcy_2L9";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type LoginMode = "admin" | "user";
type UserAuthMethod = "password" | "otp";

function isEmailOrPhone(value: string) {
  const v = value.trim();
  if (emailPattern.test(v)) return true;
  const digits = v.replace(/\D/g, "");
  return digits.length === 10;
}

function validateLogin(identity: string, password: string) {
  const errors: { identity?: string; password?: string } = {};
  const id = identity.trim();
  const pw = password.trim();

  if (!id) {
    errors.identity = "Email is required.";
  } else if (!emailPattern.test(id)) {
    errors.identity = "Enter a valid email address.";
  }

  if (!pw) {
    errors.password = "Password is required.";
  }

  return errors;
}

function validateUserOtp(identity: string, otp: string, otpSent: boolean) {
  const errors: { identity?: string; otp?: string } = {};
  const id = identity.trim();
  const digits = otp.replace(/\D/g, "");

  if (!id) {
    errors.identity = "Email or mobile number is required.";
  } else if (!isEmailOrPhone(id)) {
    errors.identity = "Enter a valid email or 10-digit mobile number.";
  }

  if (!otpSent) {
    errors.otp = "Tap Send OTP first, then enter the code.";
  } else if (digits.length < 4 || digits.length > 6) {
    errors.otp = "Enter the 4–6 digit OTP.";
  }

  return errors;
}

export function LoginView() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>("admin");
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (
      loginMode === "user" &&
      userAuthMethod === "otp" &&
      otpSent
    ) {
      otpInputRef.current?.focus();
    }
  }, [loginMode, userAuthMethod, otpSent]);

  return (
    <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#f8f9fa] text-[#191c1d]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImageUrl}
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8f9fa]/80 via-[#f3f4f5]/90 to-[#f8f9fa]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0058bc 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="pointer-events-none fixed top-[20%] -left-[10%] -z-10 h-[40%] w-[40%] rounded-full bg-[#0058bc]/5 blur-[120px]" />
      <div className="pointer-events-none fixed right-[-5%] bottom-[10%] -z-10 h-[30%] w-[30%] rounded-full bg-[#006195]/5 blur-[100px]" />

      <header className="relative z-50 flex w-full shrink-0 items-center py-2 pl-2 pr-4 sm:py-2.5 sm:pl-3 sm:pr-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Image
            src="/aerolaminar-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-9 w-9 shrink-0 translate-y-px object-contain object-center sm:h-10 sm:w-10 sm:translate-y-0.5"
            priority
            aria-hidden
          />
          <span
            className={cn(
              "leading-tight text-lg font-bold tracking-tight text-black sm:text-xl"
            )}
          >
            AEROLAMINAR
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 sm:px-5 sm:pb-2 sm:pt-2">
        <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,340px)] items-center justify-center sm:max-w-[400px]">
          <div
            className="login-glass-card relative w-full max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom,0px))] overflow-hidden rounded-xl p-3.5 shadow-lg shadow-[#4d5b7f]/12 sm:max-h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom,0px))] sm:p-4"
          >
          {/* Top accent — sits inside rounded top; avoid overflow-y-hidden so glow isn’t clipped */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-1.5 rounded-t-xl bg-gradient-to-r from-[#0058bc] via-[#0070eb] to-[#006195] shadow-[0_2px_10px_rgba(0,88,188,0.35)]"
            aria-hidden
          />

          <div className="mb-2 pt-0.5 text-center sm:mb-2.5">
            <div className="mb-1.5 flex justify-center sm:mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg border border-[#0058bc]/20 bg-[#0058bc]/10 shadow-sm sm:size-11">
                <User className="size-[22px] text-[#0058bc] sm:size-6" strokeWidth={1.75} />
              </div>
            </div>
            <h1
              className={cn(
                "mb-1.5 text-lg font-bold tracking-tight text-[#191c1d] sm:text-xl"
              )}
            >
              Welcome Back
            </h1>
            <div
              className="mb-1.5 flex rounded-lg border border-[#0058bc]/20 bg-[#e1e3e4]/35 p-0.5 shadow-inner"
              role="tablist"
              aria-label="Login type"
            >
              <button
                type="button"
                role="tab"
                id="login-tab-admin"
                aria-selected={loginMode === "admin"}
                aria-controls="login-panel"
                tabIndex={loginMode === "admin" ? 0 : -1}
                onClick={() => {
                  setLoginMode("admin");
                  setOtp("");
                  setOtpSent(false);
                  setErrors({});
                }}
                className={cn(
                  "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:px-2.5 sm:text-sm",
                  loginMode === "admin"
                    ? "bg-white text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15"
                    : "text-[#414755] hover:text-[#191c1d]"
                )}
              >
                Admin Login
              </button>
              <button
                type="button"
                role="tab"
                id="login-tab-user"
                aria-selected={loginMode === "user"}
                aria-controls="login-panel"
                tabIndex={loginMode === "user" ? 0 : -1}
                onClick={() => {
                  setLoginMode("user");
                  setOtp("");
                  setOtpSent(false);
                  setErrors({});
                }}
                className={cn(
                  "min-h-8 flex-1 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-all sm:min-h-9 sm:px-2.5 sm:text-sm",
                  loginMode === "user"
                    ? "bg-white text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15"
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
                loginMode === "admin" ? "login-tab-admin" : "login-tab-user"
              }
              className="text-xs font-medium leading-snug text-[#414755] sm:text-sm"
            >
              {loginMode === "admin"
                ? "Admin dashboard"
                : "User Dashboard"}
            </p>
          </div>

          <form
            className="space-y-2 sm:space-y-2.5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (loginMode === "user" && userAuthMethod === "otp") {
                const next = validateUserOtp(identity, otp, otpSent);
                setErrors(next);
                if (Object.keys(next).length > 0) return;
                router.push("/user-dashboard");
                return;
              }
              const next = validateLogin(identity, password);
              setErrors(next);
              if (Object.keys(next).length > 0) return;
              router.push(loginMode === "admin" ? "/dashboard" : "/user-dashboard");
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="identity"
                className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
              >
                {loginMode === "user" && userAuthMethod === "otp"
                  ? "Email or mobile"
                  : "Email address"}
              </label>
              <div className="relative">
                {loginMode === "user" && userAuthMethod === "otp" ? (
                  <Smartphone
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                ) : (
                  <User
                    className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                    aria-hidden
                  />
                )}
                <input
                  id="identity"
                  name="identity"
                  type="text"
                  autoComplete="username"
                  placeholder={
                    loginMode === "user" && userAuthMethod === "otp"
                      ? "you@email.com or 9876543210"
                      : "you@company.com"
                  }
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (errors.identity) {
                      setErrors((prev) => ({ ...prev, identity: undefined }));
                    }
                  }}
                  aria-invalid={errors.identity ? true : undefined}
                  aria-describedby={errors.identity ? "identity-error" : undefined}
                  className={cn(
                    "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                    errors.identity
                      ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                      : "focus:ring-[#0058bc]/20"
                  )}
                />
              </div>
              {errors.identity ? (
                <p
                  id="identity-error"
                  role="alert"
                  className="px-1 text-[11px] font-medium leading-snug text-red-600 sm:text-xs"
                >
                  {errors.identity}
                </p>
              ) : null}
            </div>

            {loginMode === "user" ? (
              <div className="mt-1 space-y-0.5 border-t border-[#e1e3e4] pt-1">
            {userAuthMethod === "otp" ? (
              <div className="space-y-1">
                <p className="px-1 text-[11px] leading-snug text-[#717786] sm:text-xs">
                  {otpSent
                    ? "Enter the code we sent, then tap Sign In."
                    : "We’ll send a code to your email or SMS."}
                </p>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = identity.trim();
                      if (!id) {
                        setErrors((prev) => ({
                          ...prev,
                          identity: "Enter email or mobile first.",
                        }));
                        return;
                      }
                      if (!isEmailOrPhone(id)) {
                        setErrors((prev) => ({
                          ...prev,
                          identity:
                            "Enter a valid email or 10-digit mobile number.",
                        }));
                        return;
                      }
                      setErrors((prev) => ({
                        ...prev,
                        identity: undefined,
                        otp: undefined,
                      }));
                      setOtpSent(true);
                      setOtp("");
                    }}
                    className={cn(
                      "h-9 w-full rounded-md border-2 border-[#0058bc] bg-transparent px-3 text-xs font-bold text-[#0058bc] transition hover:bg-[#0058bc]/10 sm:h-10 sm:text-sm"
                    )}
                  >
                    Send OTP
                  </button>
                ) : (
                  <div className="space-y-1">
                    <label
                      htmlFor="otp-code"
                      className="block px-1 text-xs font-semibold text-[#414755] sm:text-sm"
                    >
                      One-time password
                    </label>
                    <div className="relative">
                      <KeyRound
                        className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-[#717786] sm:left-3 sm:size-4"
                        aria-hidden
                      />
                      <input
                        ref={otpInputRef}
                        id="otp-code"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="••••••"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          const v = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setOtp(v);
                          if (errors.otp) {
                            setErrors((prev) => ({ ...prev, otp: undefined }));
                          }
                        }}
                        aria-invalid={errors.otp ? true : undefined}
                        aria-describedby={errors.otp ? "otp-error" : undefined}
                        className={cn(
                          "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm tracking-widest text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                          errors.otp
                            ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                            : "focus:ring-[#0058bc]/20"
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          const id = identity.trim();
                          if (!id) {
                            setErrors((prev) => ({
                              ...prev,
                              identity: "Enter email or mobile first.",
                            }));
                            return;
                          }
                          if (!isEmailOrPhone(id)) {
                            setErrors((prev) => ({
                              ...prev,
                              identity:
                                "Enter a valid email or 10-digit mobile number.",
                            }));
                            return;
                          }
                          setErrors((prev) => ({
                            ...prev,
                            identity: undefined,
                            otp: undefined,
                          }));
                          setOtp("");
                        }}
                        className="text-[11px] font-semibold text-[#0058bc] underline-offset-2 hover:underline sm:text-xs"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}
                {errors.otp ? (
                  <p
                    id="otp-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                  >
                    {errors.otp}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                <label
                  htmlFor="password"
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
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={cn(
                      "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                      errors.password
                        ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                        : "focus:ring-[#0058bc]/20"
                    )}
                  />
                </div>
                {errors.password ? (
                  <p
                    id="password-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                  >
                    {errors.password}
                  </p>
                ) : null}
                <div className="flex justify-end px-1">
                  <a
                    href="#"
                    className="text-[11px] font-semibold text-[#0058bc] transition-colors hover:text-[#0070eb] sm:text-xs"
                  >
                    Forgot?
                  </a>
                </div>
              </div>
            )}

                <div
                  className="flex w-full rounded-lg border border-[#0058bc]/20 bg-[#e1e3e4]/35 p-0.5 shadow-inner"
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
                        ? "bg-white text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15"
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
                        ? "bg-white text-[#0058bc] shadow-sm ring-1 ring-[#0058bc]/15"
                        : "text-[#414755] hover:text-[#191c1d]"
                    )}
                  >
                    OTP
                  </button>
                </div>

            {userAuthMethod === "password" ? (
              <div className="flex items-center gap-1.5 px-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-[#c1c6d7] bg-[#f3f4f5] text-[#0058bc] focus:ring-[#0058bc]/20 sm:size-[18px]"
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-xs font-medium text-[#414755] sm:text-sm"
                >
                  Remember me
                </label>
              </div>
            ) : null}

              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label
                    htmlFor="password"
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
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                          setErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }
                      }}
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                      className={cn(
                        "w-full rounded-md border border-[#c1c6d7] bg-transparent py-2 pl-9 pr-2.5 text-sm text-[#191c1d] placeholder:text-[#717786] outline-none transition-all focus:ring-2 sm:py-2.5 sm:pl-10",
                        errors.password
                          ? "ring-2 ring-red-500/80 focus:ring-red-500/50"
                          : "focus:ring-[#0058bc]/20"
                      )}
                    />
                  </div>
                  {errors.password ? (
                    <p
                      id="password-error"
                      role="alert"
                      className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                  <div className="flex justify-end px-1">
                    <a
                      href="#"
                      className="text-[11px] font-semibold text-[#0058bc] transition-colors hover:text-[#0070eb] sm:text-xs"
                    >
                      Forgot?
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-1">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-[#c1c6d7] bg-[#f3f4f5] text-[#0058bc] focus:ring-[#0058bc]/20 sm:size-[18px]"
                  />
                  <label
                    htmlFor="remember"
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
                "flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#0058bc] to-[#0070eb] py-2 px-3 text-sm font-bold text-white shadow-md shadow-[#0058bc]/20 transition-all hover:shadow-[#0058bc]/35 active:scale-[0.99] sm:py-2.5"
              )}
            >
              Sign In
              <ArrowRight className="size-3.5 sm:size-4" />
            </button>
          </form>

          <div className="mt-3 text-center sm:mt-4">
            <p className="text-xs font-medium text-[#414755] sm:text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="ml-1 font-bold text-[#0058bc] hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
          </div>
        </div>
      </main>

      <footer className="relative z-50 mt-auto flex shrink-0 flex-col items-center justify-center gap-1.5 border-t border-slate-200/60 bg-[#f8f9fa]/90 px-3 py-2 backdrop-blur-sm sm:flex-row sm:gap-5 sm:py-2.5">
        <span className="text-center text-[11px] tracking-wide text-slate-500 sm:text-xs">
          © 2024 AEROLAMINAR. All rights reserved.
        </span>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
          <a
            href="#"
            className="text-[11px] tracking-wide text-slate-500 underline opacity-80 transition-all hover:text-blue-400 hover:opacity-100 sm:text-xs"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-[11px] tracking-wide text-slate-500 underline opacity-80 transition-all hover:text-blue-400 hover:opacity-100 sm:text-xs"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-[11px] tracking-wide text-slate-500 underline opacity-80 transition-all hover:text-blue-400 hover:opacity-100 sm:text-xs"
          >
            Compliance
          </a>
        </div>
      </footer>
    </div>
  );
}
