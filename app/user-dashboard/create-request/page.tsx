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
      <div className="mx-auto w-full max-w-lg rounded-xl border border-[#c1c6d7]/10 bg-[#f3f4f5] p-5 sm:p-6">
        <p className="mb-4 text-xs leading-relaxed text-[#4d5b7f]">
          Initiate a drone logistics mission. Submitted requests appear under My Request.
        </p>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-200/60" />}>
          <CreateMissionRequestForm />
        </Suspense>
      </div>
    </UserDashboardShell>
  );
}
