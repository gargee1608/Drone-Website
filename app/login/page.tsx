import { LoginView } from "@/components/login/login-view";

export const metadata = {
  title: "Drone Hire — Admin Login",
  description:
    "Sign in as an administrator to access the AEROLAMINAR admin dashboard.",
};

export default function LoginPage() {
  return <LoginView adminOnly />;
}
