import {
  parseServiceStringArray,
  serviceCatalogItems,
  serviceSlugFromTitle,
  type ServiceCatalogItem,
} from "@/lib/service-catalog";

export type AdminServiceRow = {
  id: number;
  slug?: string;
  title: string;
  description: string;
  price: number;
  image: string;
  detailSections: string[];
  highlights: string[];
  createdAt?: string;
  /** Built-in website catalog entry not yet in the database (or API offline). */
  catalogOnly?: boolean;
};

export function normalizeServiceRow(raw: unknown): AdminServiceRow | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const idRaw = row.id;
  const id =
    typeof idRaw === "string"
      ? Number.parseInt(idRaw, 10)
      : typeof idRaw === "number"
        ? idRaw
        : Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const price = Number(row.price);
  const detailSections =
    parseServiceStringArray(row.detail_sections) ?? [];
  const highlights = parseServiceStringArray(row.highlights) ?? [];
  return {
    id,
    slug: typeof row.slug === "string" ? row.slug : undefined,
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    price: Number.isFinite(price) ? price : 0,
    image: String(row.image ?? ""),
    detailSections,
    highlights,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : typeof row.createdAt === "string"
          ? row.createdAt
          : undefined,
  };
}

export function parseCatalogPriceLabel(text: string): number {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? Number.parseFloat(m[1]) : 0;
}

export function catalogItemToAdminRow(
  item: ServiceCatalogItem
): AdminServiceRow {
  return {
    id: 0,
    slug: item.slug,
    title: item.title,
    description: item.description,
    price: parseCatalogPriceLabel(item.topBadge.text),
    image: item.image,
    detailSections: item.detailSections,
    highlights: item.highlights,
    catalogOnly: true,
  };
}

function rowSlugKey(row: AdminServiceRow): string {
  const slug = row.slug?.trim() || serviceSlugFromTitle(row.title);
  return slug.toLowerCase();
}

export function suppressedSlugSet(slugs: Iterable<string> = []): Set<string> {
  return new Set(
    [...slugs].map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0)
  );
}

/**
 * Same sources as the public /services page: database rows plus built-in catalog
 * entries that are not already stored (by slug). Omits admin-deleted catalog slugs.
 */
export function buildAdminServiceRows(
  dbRows: AdminServiceRow[],
  suppressedSlugs: Iterable<string> = []
): AdminServiceRow[] {
  const suppressed = suppressedSlugSet(suppressedSlugs);
  const dbSlugs = new Set(
    dbRows.map(rowSlugKey).filter((s) => s.length > 0)
  );
  const catalogRows = serviceCatalogItems
    .filter((item) => !dbSlugs.has(item.slug.toLowerCase()))
    .filter((item) => !suppressed.has(item.slug.toLowerCase()))
    .map(catalogItemToAdminRow);
  return [...dbRows, ...catalogRows];
}
