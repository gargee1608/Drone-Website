import { redirect } from "next/navigation";

/** Legacy URL; admin sign-in lives at `/admin`. */
export default function LoginPage() {
  redirect("/admin");
}
