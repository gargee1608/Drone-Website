import { PilotStatusView } from "@/components/dashboard/pilot-status-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Drone Hire | Pilot Status",
  description: "Monitor pilot readiness and availability.",
};

export default function PilotStatusPage() {
  return (
    <PilotDashboardShell pageTitle="Pilot Status">
      <PilotStatusView showPageTitle={false} />
    </PilotDashboardShell>
  );
}
