import { Suspense } from "react";

import { AdminDroneView } from "@/components/dashboard/admin-drone-view";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hire A Drone | Add New Drone Details",
  description:
    "Add and manage drone details from the admin command center (same flow as the pilot dashboard).",
};

export default function AdminDronePage() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl pb-8",
        ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>Add New Drone Details</h1>
      <div className="mt-6">
        <Suspense>
          <AdminDroneView />
        </Suspense>
      </div>
    </div>
  );
}
