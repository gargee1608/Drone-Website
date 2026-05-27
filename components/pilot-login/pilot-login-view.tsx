"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Plane, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ForgotPasswordModal } from "@/components/login/forgot-password-modal";
import { LoginView } from "@/components/login/login-view";
import { apiUrl } from "@/lib/api-url";
import {
  initPilotLoginLanguageFromStorage,
  usePilotLoginLanguage,
  type PilotLoginCopy,
} from "@/lib/pilot-login-i18n";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePilotLogin(
  email: string,
  password: string,
  messages: PilotLoginCopy["errors"]
) {
  const errors: { email?: string; password?: string } = {};
  const e = email.trim().toLowerCase();
  const pw = password.trim();
  if (!e) errors.email = messages.emailRequired;
  else if (!emailPattern.test(e)) errors.email = messages.emailInvalid;
  if (!pw) errors.password = messages.passwordRequired;
  return errors;
}

type LoginPanel = "pilot" | "user";

export function PilotLoginView() {
  const year = new Date().getFullYear();
  const { copy } = usePilotLoginLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const panelFromUrl = searchParams.get("panel");
  const [loginPanel, setLoginPanel] = useState<LoginPanel>(() =>
    panelFromUrl === "user" ? "user" : "pilot"
  );

  // Force light mode for pilot login page
  useEffect(() => {
    initPilotLoginLanguageFromStorage();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    return () => {
      document.documentElement.classList.remove("light");
    };
  }, []);

  useEffect(() => {
    document.title =
      loginPanel === "user"
        ? "Hire A Drone | User Login"
        : "Hire A Drone | Pilot Login";
  }, [loginPanel]);

  useEffect(() => {
    const p = searchParams.get("panel");
    if (p === "user") setLoginPanel("user");
    else if (p === "pilot") setLoginPanel("pilot");
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInitialEmail, setForgotInitialEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validatePilotLogin(email, password, copy.errors);
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

      const parsedBody = await readResponseJson(res);
      if (!parsedBody.okParse) {
        alert("Invalid server response");
        return;
      }

      let data: {
        token?: string;
        role?: string;
        user?: {
          role?: string;
          name?: string;
          fullName?: string;
          email?: string;
          id?: unknown;
        };
        message?: string;
        error?: string;
        detail?: string;
        hint?: string;
        /** Pilot sign-in only: from server when email unknown vs password mismatch. */
        signInError?: string;
      } = {};

      if (
        parsedBody.data &&
        typeof parsedBody.data === "object" &&
        parsedBody.data !== null
      ) {
        data = parsedBody.data as typeof data;
      }

      if (!res.ok || !data.token) {
        if (data.signInError === "email") {
          setErrors({ email: copy.errors.emailIncorrect });
          return;
        }
        if (data.signInError === "password") {
          setErrors({ password: copy.errors.passwordIncorrect });
          return;
        }
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
      localStorage.setItem("pilot", JSON.stringify(data.user));
      const redirectRaw = searchParams.get("redirect");
      const redirectPath =
        redirectRaw &&
        redirectRaw.startsWith("/") &&
        !redirectRaw.startsWith("//")
          ? redirectRaw
          : null;
      router.push(redirectPath ?? "/pilot-dashboard");
    } catch (err) {
      console.error(err);
      const detail =
        err instanceof Error ? err.message : "Could not reach the server.";
      alert(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-x-hidden overflow-y-visible bg-white text-slate-900">
      <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14">
        <div className="mt-6 w-full max-w-[min(100%,440px)] sm:mt-8">
          <div className="login-glass-card relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md sm:p-6">
          <div className="mb-4 text-center">
            <h1
              className={cn(
                ADMIN_PAGE_TITLE_CLASS,
                "text-center text-xl sm:text-2xl"
              )}
            >
              {copy.welcomeBack}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {loginPanel === "pilot"
                ? copy.pilotSubtitle
                : copy.userSubtitle}
            </p>
          </div>

          <div
            className="mb-4 flex justify-center"
            role="tablist"
            aria-label={copy.chooseSignIn}
          >
            <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                role="tab"
                aria-selected={loginPanel === "pilot"}
                id="pilot-login-tab-pilot"
                onClick={() => setLoginPanel("pilot")}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:min-h-11 sm:text-sm",
                  loginPanel === "pilot"
                    ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                    : "text-[#414755] hover:text-[#191c1d]"
                )}
              >
                <Plane className="size-4 shrink-0 text-[#008B8B]" aria-hidden />
                {copy.pilotLogin}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginPanel === "user"}
                id="pilot-login-tab-user"
                onClick={() => setLoginPanel("user")}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:min-h-11 sm:text-sm",
                  loginPanel === "user"
                    ? "border border-slate-300 bg-white text-[#191c1d] shadow-sm"
                    : "text-[#414755] hover:text-[#191c1d]"
                )}
              >
                <User className="size-4 shrink-0 text-[#008B8B]" aria-hidden />
                {copy.userLogin}
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              className={cn(
                "flex w-[200%] transition-transform duration-500 ease-out",
                loginPanel === "pilot" ? "translate-x-0" : "-translate-x-1/2"
              )}
            >
              <div className="w-1/2 shrink-0 pr-1 sm:pr-1.5">
        <div className="relative w-full">
          <form className="space-y-3 sm:space-y-4" noValidate onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="pilot-login-email"
                className="mb-1 block text-xs font-semibold tracking-wide text-slate-600"
              >
                {copy.emailAddress}
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
                  onChange={(ev) => {
                    setEmail(ev.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={cn(
                    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-[#191c1d] outline-none ring-[#008B8B]/25 transition placeholder:text-slate-400 focus:ring-2",
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-200"
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
                className="mb-1 block text-xs font-semibold tracking-wide text-slate-600"
              >
                {copy.password}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="pilot-login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => {
                    setPassword(ev.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={cn(
                    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-11 text-sm text-[#191c1d] outline-none ring-[#008B8B]/25 transition placeholder:text-slate-400 focus:ring-2",
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-200"
                  )}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "pilot-login-password-err" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-[#008B8B]/30"
                  aria-label={
                    showPassword ? copy.hidePassword : copy.showPassword
                  }
                  aria-pressed={showPassword}
                  aria-controls="pilot-login-password"
                >
                  {showPassword ? (
                    <Eye className="size-[1.15rem]" aria-hidden />
                  ) : (
                    <EyeOff className="size-[1.15rem]" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p
                  id="pilot-login-password-err"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.password}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <input
                    id="pilot-login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(ev) => setRemember(ev.target.checked)}
                    className="size-4 shrink-0 rounded border border-slate-300 bg-white text-[#008B8B] focus:outline-none focus:ring-2 focus:ring-[#008B8B]/25 sm:size-[18px]"
                  />
                  <label
                    htmlFor="pilot-login-remember"
                    className="cursor-pointer text-xs font-medium text-slate-600 sm:text-sm"
                  >
                    {copy.rememberMe}
                  </label>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-[#008B8B] underline-offset-2 hover:underline"
                  onClick={() => {
                    setForgotInitialEmail(email.trim().toLowerCase());
                    setForgotOpen(true);
                  }}
                >
                  {copy.forgotPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#008B8B] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006f6f] disabled:opacity-60"
            >
              {submitting ? copy.signingIn : copy.signInPilot}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-600">
            <Link
              href="/pilot-registration"
              className="font-semibold text-[#008B8B] underline-offset-2 hover:underline"
            >
              {copy.newPilotRegister}
            </Link>
          </p>
        </div>
              </div>
              <div className="w-1/2 shrink-0 pl-1 sm:pl-1.5 light">
                <LoginView
                  userOnly
                  embedded
                  hideWelcomeHeader
                  plainCard
                  usePilotLoginTranslations
                />
              </div>
            </div>
          </div>
          </div>
          <footer className="mt-6 text-center sm:mt-8">
            <p className="text-xs text-slate-500">{copy.copyright(year)}</p>
          </footer>
        </div>
      </main>
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={forgotInitialEmail}
        role="pilot"
      />
    </div>
  );
}
