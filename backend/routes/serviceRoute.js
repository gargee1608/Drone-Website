const express = require("express");
const router = express.Router();
const pool = require("../db");
const { isCatalogSeedSlug } = require("../lib/seed-default-services");

function slugFromTitle(title) {
  return String(title ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ✅ GET all services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM services ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Slugs admin removed from the built-in catalog (must be before /:id)
router.get("/suppressed", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT slug FROM catalog_seed_suppressed"
    );
    res.json(
      result.rows
        .map((r) => String(r.slug ?? "").trim())
        .filter(Boolean)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/suppress", async (req, res) => {
  const slug = String(req.body?.slug ?? "").trim();
  if (!slug) {
    return res.status(400).json({ error: "slug is required" });
  }
  try {
    await pool.query(
      `INSERT INTO catalog_seed_suppressed (slug) VALUES ($1)
       ON CONFLICT (slug) DO NOTHING`,
      [slug]
    );
    res.json({ ok: true, slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET single service
router.get("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM services WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD new service
router.post("/", async (req, res) => {
  const { title, description, price, image, slug: slugBody } = req.body || {};
  const slug =
    String(slugBody ?? "").trim() || slugFromTitle(title);

  try {
    const result = await pool.query(
      `INSERT INTO services (slug, title, description, price, image)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [slug, title, description, price != null ? String(price) : null, image ?? null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE service
router.put("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const { title, description, price, image, slug: slugBody } = req.body || {};
  /** Only change slug when the client sends `slug` — keeps detail URLs stable on rename. */
  const slug =
    slugBody !== undefined && slugBody !== null
      ? String(slugBody).trim() || null
      : null;
  try {
    const result = await pool.query(
      `UPDATE services
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image = COALESCE($4, image),
           slug = COALESCE($5, slug)
       WHERE id = $6
       RETURNING *`,
      [
        title ?? null,
        description ?? null,
        price != null ? String(price) : null,
        image ?? null,
        slug,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE service
router.delete("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const result = await pool.query(
      "DELETE FROM services WHERE id = $1 RETURNING id, slug",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    const deletedSlug = result.rows[0]?.slug;
    if (deletedSlug && isCatalogSeedSlug(deletedSlug)) {
      await pool.query(
        `INSERT INTO catalog_seed_suppressed (slug) VALUES ($1)
         ON CONFLICT (slug) DO NOTHING`,
        [deletedSlug]
      );
    }
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;