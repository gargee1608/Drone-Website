import { AdminServicesView } from "@/components/dashboard/admin-services-view";

export const metadata = {
  title: "Drone Hire | Manage Services",
  description:
    "Add and manage drone services from the admin command center.",
};

export default function DashboardServicesPage() {
  return <AdminServicesView />;
}
