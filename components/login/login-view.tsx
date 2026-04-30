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
import { ForgotPasswordModal } from "@/components/login/forgot-password-modal";
import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import {
  clearStoredUserSession,
  writeStoredUserSession,
  type StoredUserSession,
} from "@/lib/user-session-browser";
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

function normalizePhoneForOtpInput(value: string) {
  const input = value.trim();
  if (!input) return null;
  if (input.startsWith("+")) {
    const digits = input.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
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

export function LoginView({
  userOnly = false,
  adminOnly = false,
  embedded = false,
  hideWelcomeHeader = false,
  plainCard = false,
}: {
  /** Hide Admin login; use on pages that only offer user sign-in (e.g. next to Pilot login). */
  userOnly?: boolean;
  /** `/admin`: admin sign-in only (no User tab or user flows). */
  adminOnly?: boolean;
  /** Omit outer page shell — parent supplies layout (e.g. sliding panel). */
  embedded?: boolean;
  /** Hide icon, “User Login”, and “Welcome Back” — parent shows shared title (e.g. pilot login page). */
  hideWelcomeHeader?: boolean;
  /** No inner card chrome — sits inside a parent box (e.g. pilot login outer shell). */
  plainCard?: boolean;
} = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>(
    userOnly ? "user" : "admin"
  );
  const showAdminUserTabs = !userOnly && !adminOnly;
  const isAdminMode = adminOnly || mode === "admin";
  const isUserMode = !adminOnly && mode === "user";
  const [userAuthMethod, setUserAuthMethod] = useState<UserAuthMethod>("password");
  const [showPassword, setShowPassword] = useState(false);
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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInitialEmail, setForgotInitialEmail] = useState("");

  const sendOtp = async () => {
    const value = identity.trim();
    const email = value.toLowerCase();
    const phone = normalizePhoneForOtpInput(value);

    if (!emailPattern.test(email) && !phone) {
      alert("Enter valid email or mobile number first");
      return;
    }

    try {
      const res = emailPattern.test(email)
        ? await fetch("http://localhost:4000/send-otp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          })
        : await fetch(apiUrl("/api/auth/send-phone-otp"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone }),
          });

      const body = await readResponseJson(res);
      if (!body.okParse) {
        alert(
          "OTP service returned a non-JSON response. Check that the backend is running on port 4000."
        );
        return;
      }

      const data =
        body.data && typeof body.data === "object" && body.data !== null
          ? (body.data as { error?: string })
          : {};

      if (res.ok) {
        setOtpSent(true);
        alert(
          emailPattern.test(email)
            ? "OTP sent to Mailtrap successfully"
            : "OTP sent to your mobile successfully"
        );
      } else {
        const dataWithMessage =
          body.data && typeof body.data === "object" && body.data !== null
            ? (body.data as { error?: string; message?: string })
            : {};
        alert(dataWithMessage.message || data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  useEffect(() => {
    if (isUserMode && userAuthMethod === "otp" && otpSent) {
      otpInputRef.current?.focus();
    }
  }, [isUserMode, userAuthMethod, otpSent]);

  const signInWithBackend = async (emailRaw: string, passRaw: string) => {
    const email = emailRaw.trim().toLowerCase();
    const password = passRaw.trim();

    const res = await fetch(apiUrl("/api/auth/signin"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role: isAdminMode ? "admin" : "user",
      }),
    });

    const parsedBody = await readResponseJson(res);
    if (!parsedBody.okParse) {
      alert("Invalid server response");
      return;
    }

    let data: {
      token?: string;
      role?: string;
      user?: StoredUserSession;
      message?: string;
      error?: string;
      detail?: string;
      hint?: string;
    } = {};

    if (
      parsedBody.data &&
      typeof parsedBody.data === "object" &&
      parsedBody.data !== null
    ) {
      data = parsedBody.data as typeof data;
    }

    if (!res.ok || !data.token) {
      const fromProxy = [data.error, data.detail, data.hint]
        .filter(Boolean)
        .join(" — ");
      const head = String(data.message || data.error || "").trim();
      const tail = [data.detail, data.hint]
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
        .join(" — ");
      const combined = [head, tail].filter(Boolean).join(" — ");
      alert(combined || fromProxy || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    if (data.role === "admin") {
      clearStoredUserSession();
      router.push("/dashboard");
    } else {
      if (data.user && typeof data.user === "object") {
        writeStoredUserSession(data.user);
      }
      router.push("/user-dashboard");
    }
  };

  const card = (
        <div
          className={cn(
            "relative w-full overflow-hidden",
            plainCard
              ? "border-0 bg-transparent p-0 shadow-none"
              : "login-glass-card rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md sm:p-5",
            !embedded && !plainCard && "max-w-[min(100%,360px)] sm:max-w-[420px]"
          )}
        >
          {!hideWelcomeHeader ? (
            <div className="mb-2 text-center sm:mb-2.5">
              <div className="mb-1.5 flex justify-center sm:mb-2">
                <div className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:size-11">
                  <User
                    className="size-[22px] text-[#008B8B] sm:size-6"
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              {userOnly ? (
                <p
                  id="login-user-caption"
                  className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-[#008B8B]"
                >
                  User Login
                </p>
              ) : null}
              <h1 className={cn("mb-1.5", ADMIN_PAGE_TITLE_CLASS)}>
                Welcome Back
              </h1>
              {showAdminUserTabs ? (
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
              ) : null}
              <p
                id="login-panel"
                role={showAdminUserTabs ? "tabpanel" : undefined}
                aria-labelledby={
                  userOnly
                    ? "login-user-caption"
                    : adminOnly
                      ? undefined
                      : mode === "admin"
                        ? "login-tab-admin"
                        : "login-tab-user"
                }
                className="text-xs font-medium leading-snug text-[#414755] sm:text-sm"
              >
                {isAdminMode ? "Admin dashboard" : "User dashboard"}
              </p>
            </div>
          ) : null}
<form
  className="space-y-2 sm:space-y-2.5"
  noValidate
  onSubmit={async (e) => {
    e.preventDefault();

    // ✅ USER OTP FLOW (email flow unchanged; phone flow verifies via backend)
    if (!adminOnly && mode === "user" && userAuthMethod === "otp") {
      const next = validateUserOtp(identity, otp, otpSent);
      setErrors(next);
      if (Object.keys(next).length > 0) return;

      const id = identity.trim();
      if (emailPattern.test(id)) {
        router.push("/user-dashboard");
        return;
      }
      try {
        const phone = normalizePhoneForOtpInput(id);
        if (!phone) {
          alert("Enter a valid mobile number.");
          return;
        }
        const res = await fetch(apiUrl("/api/auth/verify-phone-otp"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp }),
        });
        const body = await readResponseJson(res);
        if (!body.okParse) {
          alert("Invalid server response");
          return;
        }
        const data =
          body.data && typeof body.data === "object" && body.data !== null
            ? (body.data as {
                token?: string;
                message?: string;
                error?: string;
                user?: StoredUserSession;
              })
            : {};
        if (!res.ok || !data.token) {
          alert(data.message || data.error || "OTP verification failed");
          return;
        }
        localStorage.setItem("token", data.token);
        if (data.user && typeof data.user === "object") {
          writeStoredUserSession(data.user);
        }
        router.push("/user-dashboard");
      } catch (error) {
        console.error(error);
        alert("Could not verify mobile OTP.");
      }
      return;
    }

    // ✅ ADMIN LOGIN (API: test@gmail.com / test123 → token + role)
    if (adminOnly || mode === "admin") {
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
            {isUserMode ? (
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
                {isUserMode && userAuthMethod === "otp"
                  ? "Email or mobile"
                  : isAdminMode
                    ? "Email Address"
                    : "Email or mobile"}
              </label>
              <div className="relative">
                {isAdminMode ? (
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
                  type={isAdminMode ? "email" : "text"}
                  autoComplete={isAdminMode ? "email" : "username"}
                  placeholder={
                    isAdminMode
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

            {isUserMode && userAuthMethod === "otp" ? (
              <div className="space-y-2">
               <button
  type="button"
  className="w-full rounded-md border border-slate-300 bg-white py-2 text-xs font-semibold text-[#191c1d] shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:text-sm"
  onClick={sendOtp}
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
                      type={showPassword ? "text" : "password"}
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
                  <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <input
                        id="login-show-password"
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="size-4 shrink-0 rounded border border-slate-300 bg-white text-[#008B8B] focus:outline-none focus:ring-0 sm:size-[18px]"
                      />
                      <label
                        htmlFor="login-show-password"
                        className="cursor-pointer text-xs font-medium text-[#414755] sm:text-sm"
                      >
                        Show password
                      </label>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-[11px] font-semibold text-[#008B8B] transition-colors hover:text-[#006b6b] sm:text-xs"
                      onClick={() => {
                        const id = identity.trim();
                        setForgotInitialEmail(
                          emailPattern.test(id) ? id.toLowerCase() : ""
                        );
                        setForgotOpen(true);
                      }}
                    >
                      Forgot Password?
                    </button>
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
                  {errors.password ? (
                    <p
                      id="login-password-error"
                      role="alert"
                      className="px-1 text-[11px] font-medium leading-tight text-red-600 sm:text-xs"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#008B8B] to-[#006b6b] py-2 px-3 text-sm font-bold text-white shadow-md shadow-[#008B8B]/20 transition-all hover:shadow-[#008B8B]/35 active:scale-[0.99] sm:py-2.5"
              )}
            >
              {isAdminMode
                ? "Sign in to Admin Dashboard"
                : "Sign in to User Dashboard"}
              <ArrowRight className="size-3.5 sm:size-4" />
            </button>
          </form>

          {!adminOnly ? (
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
          ) : null}
        </div>
  );

  const forgotModal = (
    <ForgotPasswordModal
      open={forgotOpen}
      onClose={() => setForgotOpen(false)}
      initialEmail={forgotInitialEmail}
      role={isAdminMode ? "admin" : "user"}
    />
  );

  if (embedded) {
    return (
      <>
        {card}
        {forgotModal}
      </>
    );
  }

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-hidden overflow-y-visible bg-background text-foreground">
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
        {card}
      </main>
      {forgotModal}
    </div>
  );
}
