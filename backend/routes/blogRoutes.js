const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, content, image, created_at FROM blogs ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[blogs] list", err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

router.get("/id/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const result = await pool.query(
      "SELECT id, title, content, image, created_at FROM blogs WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[blogs] get", err);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

router.post("/", async (req, res) => {
  const title = req.body?.title != null ? String(req.body.title).trim() : "";
  const content =
    req.body?.content != null ? String(req.body.content) : "";
  const image =
    req.body?.image != null ? String(req.body.image).trim() : "";

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO blogs (title, content, image)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, image, created_at`,
      [
        title,
        content,
        image || "https://via.placeholder.com/400",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[blogs] create", err);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const title = req.body?.title != null ? String(req.body.title).trim() : "";
  const content =
    req.body?.content != null ? String(req.body.content) : "";
  const image =
    req.body?.image != null ? String(req.body.image).trim() : "";

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE blogs
       SET title = $1, content = $2, image = $3
       WHERE id = $4
       RETURNING id, title, content, image, created_at`,
      [
        title,
        content,
        image || "https://via.placeholder.com/400",
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[blogs] update", err);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const result = await pool.query("DELETE FROM blogs WHERE id = $1 RETURNING id", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ ok: true, id });
  } catch (err) {
    console.error("[blogs] delete", err);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

module.exports = router;
