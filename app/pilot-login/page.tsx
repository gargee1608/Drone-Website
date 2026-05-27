import type { Metadata } from "next";
import { Suspense } from "react";
import { PilotLoginView } from "@/components/pilot-login/pilot-login-view";

type PageProps = {
  searchParams: Promise<{ panel?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isUser = params.panel === "user";
  return {
    title: isUser ? "Hire A Drone | User Login" : "Hire A Drone | Pilot Login",
    description: isUser
      ? "Sign in to your user dashboard."
      : "Sign in as a certified pilot to open your pilot dashboard.",
  };
}

export default function PilotLoginPage() {
  return (
    <Suspense fallback={null}>
      <PilotLoginView />
    </Suspense>
  );
}
