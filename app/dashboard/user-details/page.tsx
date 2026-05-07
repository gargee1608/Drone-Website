import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";

export const metadata = {
  title: "Drone Hire | Add User Details",
  description: "Add and manage user details from the admin command center.",
};

export default function UserDetailsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <h1 className={ADMIN_PAGE_TITLE_CLASS}>Add User Details</h1>
      <div className="mt-6">
        <div className="rounded-xl border border-border bg-muted/25 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            User Details Management
          </h2>
          <p className="text-muted-foreground mb-6">
            This section allows administrators to add and manage user details. 
            Functionality for adding user details will be implemented here.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-2">Add New User</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new user account with basic information.
              </p>
              <button className="px-4 py-2 bg-[#008B8B] text-white rounded-lg hover:bg-[#008B8B]/90 transition-colors">
                Add New User
              </button>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-2">Manage Existing Users</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View and edit existing user accounts and details.
              </p>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                View Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
