import { useSyncExternalStore } from "react";

import type { AdminService } from "@/lib/admin-services";
import {
  serviceSlugFromTitle,
  type ServiceCatalogItem,
} from "@/lib/service-catalog";

export const SERVICES_FEATURED_SELECTION_KEY =
  "aerolaminar_services_featured_selection_v1";

export const SERVICES_FEATURED_SLUG_KEY =
  "aerolaminar_services_featured_slug_v1";

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

let cacheSlugJson: string | null = null;
let cacheSlugVal: string | null = null;
let cacheSlugValid = false;

function invalidateFeaturedSelectionCache() {
  cacheValid = false;
  cacheSlugValid = false;
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

function getFeaturedSlugSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SERVICES_FEATURED_SLUG_KEY);
  const norm = raw ?? "";
  if (cacheSlugValid && norm === cacheSlugJson) return cacheSlugVal;
  cacheSlugJson = norm;
  cacheSlugVal = norm === "" ? null : norm;
  cacheSlugValid = true;
  return cacheSlugVal;
}

function getFeaturedSelectionServerSnapshot(): FeaturedListedService | null {
  return null;
}

function getFeaturedSlugServerSnapshot(): string | null {
  return null;
}

function subscribeFeaturedSelection(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === SERVICES_FEATURED_SELECTION_KEY ||
      e.key === SERVICES_FEATURED_SLUG_KEY ||
      e.key === null
    ) {
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

export function useFeaturedServiceSlug(): string | null {
  return useSyncExternalStore(
    subscribeFeaturedSelection,
    getFeaturedSlugSnapshot,
    getFeaturedSlugServerSnapshot
  );
}

function slugFromFeaturedEntry(entry: FeaturedListedService): string | null {
  if (entry.kind === "static") return entry.item.slug;
  if (entry.kind === "db") {
    const rawSlug = entry.item.slug;
    if (typeof rawSlug === "string" && rawSlug.trim()) return rawSlug.trim();
    const title = typeof entry.item.title === "string" ? entry.item.title : "";
    return title.trim() ? serviceSlugFromTitle(title) : null;
  }
  return null;
}

export function featuredEntryFromCatalogItem(
  item: ServiceCatalogItem
): FeaturedListedService {
  return { kind: "static", key: `static:${item.slug}`, item };
}

export function writeFeaturedSlug(slug: string) {
  if (typeof window === "undefined") return;
  const trimmed = slug.trim();
  if (!trimmed) return;
  invalidateFeaturedSelectionCache();
  localStorage.setItem(SERVICES_FEATURED_SLUG_KEY, trimmed);
  invalidateFeaturedSelectionCache();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function writeFeaturedSelection(entry: FeaturedListedService | null) {
  if (typeof window === "undefined") return;
  invalidateFeaturedSelectionCache();
  if (entry === null) {
    localStorage.removeItem(SERVICES_FEATURED_SELECTION_KEY);
    localStorage.removeItem(SERVICES_FEATURED_SLUG_KEY);
  } else {
    localStorage.setItem(
      SERVICES_FEATURED_SELECTION_KEY,
      JSON.stringify(entry)
    );
    const slug = slugFromFeaturedEntry(entry);
    if (slug) {
      localStorage.setItem(SERVICES_FEATURED_SLUG_KEY, slug);
    }
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

/** Default hero on /services — matches first catalog item (Medical Logistics). */
export const DEFAULT_FEATURED_SERVICE_SLUG = "medical-logistics";

export function findListedServiceBySlug(
  slug: string,
  live: FeaturedListedService[]
): FeaturedListedService | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  for (const entry of live) {
    if (entry.kind === "static") {
      if (entry.item.slug.toLowerCase() === normalized) return entry;
      continue;
    }
    if (entry.kind === "db") {
      const entrySlug =
        typeof entry.item.slug === "string" && entry.item.slug.trim()
          ? entry.item.slug.trim()
          : serviceSlugFromTitle(String(entry.item.title ?? ""));
      if (entrySlug.toLowerCase() === normalized) return entry;
    }
  }

  return null;
}

export function resolveFeaturedDisplay(
  persistedSlug: string | null,
  persistedEntry: FeaturedListedService | null,
  live: FeaturedListedService[]
): FeaturedListedService | null {
  if (persistedSlug?.trim()) {
    const bySlug = findListedServiceBySlug(persistedSlug, live);
    if (bySlug) return bySlug;
  }

  const merged = mergeFeaturedWithLive(persistedEntry, live);
  if (merged) {
    const liveMatch = live.find((entry) => entry.key === merged.key);
    if (liveMatch) return liveMatch;

    const slug =
      merged.kind === "static"
        ? merged.item.slug
        : slugFromFeaturedEntry(merged);
    if (slug) {
      const bySlug = findListedServiceBySlug(slug, live);
      if (bySlug) return bySlug;
    }

    return merged;
  }

  return resolveDefaultFeaturedEntry(live);
}

export function resolveDefaultFeaturedEntry(
  live: FeaturedListedService[]
): FeaturedListedService | null {
  if (live.length === 0) return null;

  const matchesDefaultSlug = (entry: FeaturedListedService) => {
    if (entry.kind === "static") {
      return entry.item.slug === DEFAULT_FEATURED_SERVICE_SLUG;
    }
    if (entry.kind === "db") {
      const slug =
        typeof entry.item.slug === "string" ? entry.item.slug.trim() : "";
      return slug === DEFAULT_FEATURED_SERVICE_SLUG;
    }
    return false;
  };

  return live.find(matchesDefaultSlug) ?? live[0];
}

/** Catalog grid — excludes whichever service is in the featured panel. */
export function listedServicesExcludingFeatured(
  live: FeaturedListedService[],
  featured: FeaturedListedService | null
): FeaturedListedService[] {
  if (!featured) return live;
  return live.filter((entry) => entry.key !== featured.key);
}
