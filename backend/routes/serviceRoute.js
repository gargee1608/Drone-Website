const express = require("express");
const router = express.Router();
const pool = require("../db");


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
  const { title, description, price, image } = req.body || {};

  try {
    const result = await pool.query(
      "INSERT INTO services (title, description, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, price, image ?? null]
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
  const { title, description, price, image } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE services
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image = COALESCE($4, image)
       WHERE id = $5
       RETURNING *`,
      [title ?? null, description ?? null, price ?? null, image ?? null, id]
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
      "DELETE FROM services WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;