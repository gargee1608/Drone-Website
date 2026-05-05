import { Suspense } from "react";

import { ResetPasswordView } from "@/components/login/reset-password-view";

export const metadata = {
  title: "Reset password — Drone Hire",
  description: "Set a new password using the link from your email.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col bg-background text-foreground">
      <Suspense
        fallback={
          <div className="mx-auto px-4 py-16 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <ResetPasswordView />
      </Suspense>
    </div>
  );
}
