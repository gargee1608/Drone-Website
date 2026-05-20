import { AdminUserManagement } from "@/components/dashboard/admin-user-management";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

export const metadata = {
  title: "Hire A Drone | User Management",
  description: "Manage user accounts and permissions from the admin command center.",
};

export default function UserDetailsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>User Management</h1>
      <div className="mt-6">
        <AdminUserManagement />
      </div>
    </div>
  );
}
