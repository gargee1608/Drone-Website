import { PilotDroneView } from "@/components/pilot-dashboard/pilot-drone-view";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

export const metadata = {
  title: "Drone Hire | Add New Drone Details",
  description:
    "Add and manage drone details from the admin command center (same flow as the pilot dashboard).",
};

export default function AdminDronePage() {
  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>Add New Drone Details</h1>
      <div className="mt-6">
        <PilotDroneView />
      </div>
    </div>
  );
}
