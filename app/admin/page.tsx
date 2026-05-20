import { AdminLoginView } from "@/components/admin-login/admin-login-view";

export const metadata = {
  title: "Hire A Drone — Admin Login",
  description:
    "Sign in as an administrator to access the AEROLAMINAR admin dashboard.",
};

export default function AdminLoginPage() {
  return <AdminLoginView />;
}
