import { useSyncExternalStore } from "react";

import type { AdminService } from "@/lib/admin-services";
import type { ServiceCatalogItem } from "@/lib/service-catalog";

export const SERVICES_FEATURED_SELECTION_KEY =
  "aerolaminar_services_featured_selection_v1";

const CHANGE_EVENT = "aerolaminar-services-featured-selection";

export type FeaturedListedService =
  | { kind: "static"; key: string; item: ServiceCatalogItem }
  | { kind: "admin"; key: string; item: AdminService }
  | { kind: "db"; key: string; item: Record<string, unknown> };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseFeaturedListedService(
  raw: string | null
): FeaturedListedService | null {
  if (raw == null || raw === "") return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!isRecord(v)) return null;
    if (typeof v.key !== "string" || !v.key) return null;
    const kind = v.kind;
    if (kind !== "static" && kind !== "admin" && kind !== "db") return null;
    if (!isRecord(v.item)) return null;
    return v as FeaturedListedService;
  } catch {
    return null;
  }
}

let cacheJson: string | null = null;
let cacheVal: FeaturedListedService | null = null;
let cacheValid = false;

function invalidateFeaturedSelectionCache() {
  cacheValid = false;
}

function getFeaturedSelectionSnapshot(): FeaturedListedService | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SERVICES_FEATURED_SELECTION_KEY);
  const norm = raw ?? "";
  if (cacheValid && norm === cacheJson) return cacheVal;
  cacheJson = norm;
  cacheVal = norm === "" ? null : parseFeaturedListedService(raw);
  cacheValid = true;
  return cacheVal;
}

function getFeaturedSelectionServerSnapshot(): FeaturedListedService | null {
  return null;
}

function subscribeFeaturedSelection(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === SERVICES_FEATURED_SELECTION_KEY || e.key === null) {
      invalidateFeaturedSelectionCache();
      onStoreChange();
    }
  };
  const onLocal = () => {
    invalidateFeaturedSelectionCache();
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

export function useFeaturedServiceSelection(): FeaturedListedService | null {
  return useSyncExternalStore(
    subscribeFeaturedSelection,
    getFeaturedSelectionSnapshot,
    getFeaturedSelectionServerSnapshot
  );
}

export function writeFeaturedSelection(entry: FeaturedListedService | null) {
  if (typeof window === "undefined") return;
  invalidateFeaturedSelectionCache();
  if (entry === null) {
    localStorage.removeItem(SERVICES_FEATURED_SELECTION_KEY);
  } else {
    localStorage.setItem(
      SERVICES_FEATURED_SELECTION_KEY,
      JSON.stringify(entry)
    );
  }
  invalidateFeaturedSelectionCache();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function mergeFeaturedWithLive(
  persisted: FeaturedListedService | null,
  live: FeaturedListedService[]
): FeaturedListedService | null {
  if (!persisted) return null;
  const found = live.find((e) => e.key === persisted.key);
  return found ?? persisted;
}
