import { CompletedDeliveriesView } from "@/components/dashboard/completed-deliveries-view";
import { PilotDashboardShell } from "@/components/pilot-dashboard/pilot-dashboard-shell";

export const metadata = {
  title: "Hire A Drone | Pilot Completed Deliveries",
  description: "Track completed deliveries from pilot command view.",
};

export default function PilotCompletedDeliveriesPage() {
  return (
    <PilotDashboardShell pageTitle="Completed Deliveries">
      <CompletedDeliveriesView showPageTitle={false} pilotScoped />
    </PilotDashboardShell>
  );
}
