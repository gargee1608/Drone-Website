import { UserRequestsView } from "@/components/dashboard/user-requests-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Drone Hire | Pilot User Request",
  description: "Review and manage user requests from pilot command view.",
};

export default function PilotUserRequestsPage() {
  return (
    <PilotDashboardShell pageTitle="User Request">
      <UserRequestsView showPageTitle={false} />
    </PilotDashboardShell>
  );
}
