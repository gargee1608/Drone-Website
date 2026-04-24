"use client";

import { useLayoutEffect, useState } from "react";

import { readPilotProfileSnapshotRawFromBrowser } from "@/lib/pilot-profile-browser-storage";
import {
  parsePilotProfileSnapshot,
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
        readPilotProfileSnapshotRawFromBrowser()
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
