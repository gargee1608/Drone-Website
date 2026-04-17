import { CompletedDeliveriesView } from "@/components/dashboard/completed-deliveries-view";

export const metadata = {
  title: "Drone Hire | Completed Deliveries",
  description:
    "Track finalized delivery missions and operational completion metrics.",
};

export default function CompletedDeliveriesPage() {
  return <CompletedDeliveriesView />;
}

