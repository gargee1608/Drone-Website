import { Suspense } from "react";

import { CreateMissionRequestForm } from "@/components/user-dashboard/create-mission-request-form";
import { UserDashboardShell } from "@/components/user-dashboard/user-dashboard-shell";

export const metadata = {
  title: "Drone Hire | Create request",
  description: "Create a new drone logistics mission request.",
};

export default function UserDashboardCreateRequestPage() {
  return (
    <UserDashboardShell
      pageTitle="Create New Request"
      pageTitleClassName="text-center"
    >
      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Initiate a drone logistics mission. Submitted requests appear under My Request.
        </p>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
          <CreateMissionRequestForm />
        </Suspense>
      </div>
    </UserDashboardShell>
  );
}
