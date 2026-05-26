"use client";

import { useEffect } from "react";

import type { ServiceCatalogItem } from "@/lib/service-catalog";
import {
  featuredEntryFromCatalogItem,
  writeFeaturedSelection,
  writeFeaturedSlug,
} from "@/lib/services-featured-selection";

/** Remember which service was opened so /services featured panel matches on return. */
export function PersistFeaturedService({ item }: { item: ServiceCatalogItem }) {
  useEffect(() => {
    writeFeaturedSlug(item.slug);
    writeFeaturedSelection(featuredEntryFromCatalogItem(item));
  }, [item.slug, item]);

  return null;
}
