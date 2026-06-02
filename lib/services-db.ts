import { getPgPool } from "@/lib/pg-pool";

export type ServiceApiRow = {
  id: number | string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
  created_at?: string | null;
};

/** Loads services from PostgreSQL (same table as Express `/api/services`). */
export async function queryAllServices(): Promise<ServiceApiRow[]> {
  const result = await getPgPool().query(
    `SELECT id, slug, title, description, price, image, created_at
     FROM services
     ORDER BY id DESC`
  );
  return result.rows as ServiceApiRow[];
}

/** Slugs removed by admin (built-in catalog entries stay hidden after delete). */
export async function querySuppressedServiceSlugs(): Promise<string[]> {
  try {
    const result = await getPgPool().query(
      "SELECT slug FROM catalog_seed_suppressed"
    );
    return result.rows
      .map((row) => String((row as { slug?: unknown }).slug ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function suppressServiceSlug(slug: string): Promise<void> {
  const normalized = slug.trim();
  if (!normalized) {
    throw new Error("slug is required");
  }
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS catalog_seed_suppressed (
      slug TEXT PRIMARY KEY
    )
  `);
  await getPgPool().query(
    `INSERT INTO catalog_seed_suppressed (slug) VALUES ($1)
     ON CONFLICT (slug) DO NOTHING`,
    [normalized]
  );
}
