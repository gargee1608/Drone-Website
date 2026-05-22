const path = require("path");
const fs = require("fs");

const SEED_PATH = path.join(__dirname, "..", "..", "lib", "service-catalog-seed.json");

let catalogSeedSlugSet = null;

function loadCatalogSeedRows() {
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[services] Could not load catalog seed:", e.message);
    return [];
  }
}

function getCatalogSeedSlugSet() {
  if (!catalogSeedSlugSet) {
    catalogSeedSlugSet = new Set(
      loadCatalogSeedRows()
        .map((row) => String(row.slug ?? "").trim())
        .filter(Boolean)
    );
  }
  return catalogSeedSlugSet;
}

function isCatalogSeedSlug(slug) {
  return getCatalogSeedSlugSet().has(String(slug ?? "").trim());
}

/**
 * Ensures built-in website services exist in `services` so the admin dashboard can manage them.
 * Skips slugs the admin deleted (stored in `catalog_seed_suppressed`).
 */
async function seedDefaultServicesIfNeeded(pool) {
  const rows = loadCatalogSeedRows();
  if (rows.length === 0) return;

  let suppressed = new Set();
  try {
    const suppressedResult = await pool.query(
      "SELECT slug FROM catalog_seed_suppressed"
    );
    suppressed = new Set(
      suppressedResult.rows
        .map((r) => String(r.slug ?? "").trim())
        .filter(Boolean)
    );
  } catch (e) {
    console.warn("[services] catalog_seed_suppressed:", e.message);
  }

  for (const row of rows) {
    const slug = String(row.slug ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (!slug || !title || suppressed.has(slug)) continue;

    const existing = await pool.query(
      "SELECT id FROM services WHERE slug = $1 LIMIT 1",
      [slug]
    );
    if (existing.rows.length > 0) continue;

    const description = String(row.description ?? "").trim();
    const price = row.price != null ? String(row.price) : null;
    const image = row.image != null ? String(row.image) : null;

    await pool.query(
      `INSERT INTO services (slug, title, description, price, image)
       VALUES ($1, $2, $3, $4, $5)`,
      [slug, title, description, price, image]
    );
  }
}

module.exports = {
  seedDefaultServicesIfNeeded,
  loadCatalogSeedRows,
  isCatalogSeedSlug,
};
