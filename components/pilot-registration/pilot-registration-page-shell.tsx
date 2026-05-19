"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PilotRegistrationView } from "@/components/pilot-registration/pilot-registration";
import {
  isPilotRegistrationFromAdmin,
  pilotRegistrationInitialStep,
} from "@/lib/pilot-registration-from-admin";

function PilotRegistrationPageShellInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromAdmin = isPilotRegistrationFromAdmin(
    pathname,
    searchParams.get("from")
  );
  const initialStep = pilotRegistrationInitialStep(searchParams.get("step"));

  if (fromAdmin) {
    return (
      <div className="light-header">
        <DashboardLayout>
          <PilotRegistrationView
            fromAdminDashboard
            initialStep={initialStep}
            adminPilotId={searchParams.get("pilotId")}
          />
        </DashboardLayout>
      </div>
    );
  }

  return <PilotRegistrationView initialStep={initialStep} />;
}

export function PilotRegistrationPageShell() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[12rem] bg-background" aria-hidden />
      }
    >
      <PilotRegistrationPageShellInner />
    </Suspense>
  );
}
