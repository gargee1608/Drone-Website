/** Query `from=admin` on `/pilot-registration` — opened from Admin Dashboard (Add drone details). */
export const PILOT_REGISTRATION_FROM_ADMIN = "admin";

export function isPilotRegistrationFromAdmin(
  pathname: string | null | undefined,
  fromParam: string | null | undefined
): boolean {
  const onPilotRegistration =
    pathname === "/pilot-registration" ||
    (pathname?.startsWith("/pilot-registration/") ?? false);
  return onPilotRegistration && fromParam === PILOT_REGISTRATION_FROM_ADMIN;
}

/** Registration wizard step from `?step=` (admin Add drone details uses `3`). */
export function pilotRegistrationInitialStep(
  stepParam: string | null | undefined
): number {
  if (stepParam === "3") return 3;
  if (stepParam === "4") return 4;
  if (stepParam === "2") return 2;
  return 1;
}
