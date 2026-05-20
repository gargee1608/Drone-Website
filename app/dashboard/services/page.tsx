import { AdminServicesView } from "@/components/dashboard/admin-services-view";

export const metadata = {
  title: "Hire A Drone | Manage Services",
  description:
    "Add and manage drone services from the admin command center.",
};

export default function DashboardServicesPage() {
  return <AdminServicesView />;
}
