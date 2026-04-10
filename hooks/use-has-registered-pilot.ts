"use client";

import { useLayoutEffect, useState } from "react";

import {
  parsePilotProfileSnapshot,
  PILOT_PROFILE_STORAGE_KEY,
  PILOT_PROFILE_UPDATED_EVENT,
} from "@/lib/pilot-profile-snapshot";

/**
 * True when a submitted pilot profile exists in localStorage (non-empty full name).
 */
export function useHasRegisteredPilot() {
  const [hasRegisteredPilot, setHasRegisteredPilot] = useState(false);

  useLayoutEffect(() => {
    function read() {
      const s = parsePilotProfileSnapshot(
        localStorage.getItem(PILOT_PROFILE_STORAGE_KEY)
      );
      setHasRegisteredPilot(Boolean(s?.fullName?.trim()));
    }
    read();
    window.addEventListener("storage", read);
    window.addEventListener(PILOT_PROFILE_UPDATED_EVENT, read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(PILOT_PROFILE_UPDATED_EVENT, read);
      window.removeEventListener("focus", read);
    };
  }, []);

  return hasRegisteredPilot;
}
