import type { Metadata } from "next";

import { AdminProfileView } from "@/components/dashboard/admin-profile-view";

export const metadata: Metadata = {
  title: "Profile — Drone Hire",
  description: "Administrator profile in the command center.",
};

export default function DashboardProfilePage() {
  return <AdminProfileView />;
}
