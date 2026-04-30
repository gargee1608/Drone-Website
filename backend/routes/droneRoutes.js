const express = require("express");
const router = express.Router();
const pool = require("../db");

function droneJsonValue(v) {
  if (typeof v === "bigint") {
    return v <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(v)
      : v.toString();
  }
  return v;
}

function droneRowForJson(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = droneJsonValue(v);
  }
  return out;
}

/** List drones (optional join to pilot name for admin Assign UI). */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.*,
        p.name AS pilot_name
      FROM drones d
      LEFT JOIN pilots p ON p.id = d.pilot_id
      ORDER BY d.id ASC
    `);
    res.json(result.rows.map((r) => droneRowForJson(r)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
