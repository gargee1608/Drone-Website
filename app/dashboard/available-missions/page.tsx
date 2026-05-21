import { AvailableMissionsView } from "@/components/dashboard/available-missions-view";

export const metadata = {
  title: "Hire A Drone | Available Mission",
  description:
    "Review open missions from the matching hub catalog in the admin command center.",
};

export default function AvailableMissionsPage() {
  return <AvailableMissionsView />;
}
