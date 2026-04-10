import { UserDashboardView } from "@/components/user-dashboard/user-dashboard-view";

export const metadata = {
  title: "AEROLAMINAR | User Dashboard",
  description:
    "Mission inquiry, wallet, live map, active tracking, and mission logs.",
};

export default function UserDashboardPage() {
  return <UserDashboardView />;
}
