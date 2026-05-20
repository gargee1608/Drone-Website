import { AdminBlogsView } from "@/components/dashboard/admin-blogs-view";

export const metadata = {
  title: "Hire A Drone | Manage Blogs",
  description: "Create and edit Flight Log posts from the admin command center.",
};

export default function DashboardBlogsPage() {
  return <AdminBlogsView />;
}
