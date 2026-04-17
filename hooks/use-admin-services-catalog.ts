"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  ADMIN_SERVICES_STORAGE_KEY,
  ADMIN_SERVICES_UPDATED_EVENT,
  parseAdminServicesJsonSnapshot,
  type AdminService,
} from "@/lib/admin-services";

/**
 * Subscribes to `localStorage` admin services so the list stays correct after
 * refresh, back/forward cache, and updates from other tabs.
 */
function subscribe(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const run = () => {
    onChange();
  };
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) onChange();
  };
  window.addEventListener(ADMIN_SERVICES_UPDATED_EVENT, run);
  window.addEventListener("storage", run);
  window.addEventListener("pageshow", onPageShow);
  return () => {
    window.removeEventListener(ADMIN_SERVICES_UPDATED_EVENT, run);
    window.removeEventListener("storage", run);
    window.removeEventListener("pageshow", onPageShow);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") {
    return "[]";
  }
  return localStorage.getItem(ADMIN_SERVICES_STORAGE_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function useAdminServicesCatalog(): AdminService[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => parseAdminServicesJsonSnapshot(raw), [raw]);
}
