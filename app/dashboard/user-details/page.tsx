import { AdminUserManagement } from "@/components/dashboard/admin-user-management";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hire A Drone | User Management",
  description: "Manage user accounts and permissions from the admin command center.",
};

export default function UserDetailsPage() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl pb-8",
        ADMIN_PAGE_TOP_PADDING_CLASS
      )}
    >
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>User Management</h1>
      <div className="mt-6">
        <AdminUserManagement />
      </div>
    </div>
  );
}
