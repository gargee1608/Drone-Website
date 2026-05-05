"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/api-url";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const token = useMemo(
    () => String(searchParams.get("token") ?? "").trim(),
    [searchParams]
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = useCallback(async () => {
    if (!token) {
      setNote("This link is missing the reset token. Use the link from your email.");
      return;
    }
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
      const res = await fetch(apiUrl("/api/auth/forgot-password-reset-from-link"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
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
        setNote(
          String(data.message ?? "") ||
            "Could not reset password. The link may have expired."
        );
        return;
      }
      setDone(true);
    } catch {
      setNote("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [token, newPassword, confirmPassword]);

  const primaryLinkClass =
    "font-semibold text-[#008B8B] hover:underline dark:text-[#5eead4]";

  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      {children}
    </main>
  );

  if (!token) {
    return shell(
      <>
        <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "text-xl text-foreground")}>
          Invalid reset link
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the reset link from your email, or request a new one from the login
          page.
        </p>
        <Link
          href="/pilot-login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#008B8B] text-sm font-semibold text-white transition-colors hover:bg-[#006f6f]"
        >
          Go to login
        </Link>
      </>
    );
  }

  if (done) {
    return shell(
      <>
        <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "text-xl text-foreground")}>
          Password updated
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can sign in with your new password.
        </p>
        <Link
          href="/pilot-login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#008B8B] text-sm font-semibold text-white transition-colors hover:bg-[#006f6f]"
        >
          Back to login
        </Link>
      </>
    );
  }

  return shell(
    <>
      <h1 className={cn(ADMIN_PAGE_TITLE_CLASS, "text-xl text-foreground")}>
        Set new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a new password for your account. This page was opened from your reset
        email.
      </p>
      <div className="mt-6 space-y-3">
        <div>
          <label
            htmlFor="reset-new-password"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            New password
          </label>
          <Input
            id="reset-new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (note) setNote("");
            }}
            className="h-11 rounded-lg border-border bg-background text-foreground"
          />
        </div>
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Confirm password
          </label>
          <Input
            id="reset-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (note) setNote("");
            }}
            className="h-11 rounded-lg border-border bg-background text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <input
            id="reset-show-password"
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="size-4 shrink-0 rounded border border-border bg-background text-[#008B8B] accent-[#008B8B] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <label
            htmlFor="reset-show-password"
            className="cursor-pointer text-xs font-medium text-foreground"
          >
            Show password
          </label>
        </div>
      </div>
      {note ? (
        <p
          className={cn(
            "mt-3 text-xs font-semibold",
            note.toLowerCase().includes("match") ||
              note.toLowerCase().includes("characters") ||
              note.toLowerCase().includes("invalid") ||
              note.toLowerCase().includes("expired")
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {note}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={loading}
        onClick={submit}
        className="mt-5 w-full rounded-lg bg-[#008B8B] py-2.5 text-sm font-semibold text-white hover:bg-[#006f6f] disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </Button>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/pilot-login" className={primaryLinkClass}>
          Back to login
        </Link>
      </p>
    </>
  );
}
