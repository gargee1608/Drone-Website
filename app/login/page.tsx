import { LoginView } from "@/components/login/login-view";

export const metadata = {
  title: "AEROLAMINAR — Secure Login",
  description:
    "Sign in as an administrator or user to access your AEROLAMINAR account.",
};

export default function LoginPage() {
  return <LoginView />;
}
