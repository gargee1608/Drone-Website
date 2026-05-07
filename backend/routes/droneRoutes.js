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

/** Create a new drone */
router.post("/", async (req, res) => {
  try {
    const {
      pilot_id,
      model_name,
      type,
      camera,
      payload_kg,
      flight_time_min,
      range_km,
      use_cases
    } = req.body;

    // Validate required fields
    if (!model_name || !type) {
      return res.status(400).json({ 
        error: "Model name and type are required" 
      });
    }

    // Convert numeric fields
    const payloadKg = payload_kg ? parseFloat(payload_kg) : null;
    const flightTimeMin = flight_time_min ? parseInt(flight_time_min, 10) : null;
    const rangeKm = range_km ? parseFloat(range_km) : null;

    const result = await pool.query(`
      INSERT INTO drones (
        pilot_id,
        model_name,
        type,
        camera,
        max_payload_kg,
        flight_time_min,
        max_range_km,
        use_cases
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      pilot_id || null,
      model_name,
      type,
      camera || null,
      payloadKg,
      flightTimeMin,
      rangeKm,
      use_cases || []
    ]);

    res.status(201).json(droneRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error creating drone:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Delete a drone */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Drone ID is required" });
    }

    const result = await pool.query(
      "DELETE FROM drones WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drone not found" });
    }

    res.json(droneRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error deleting drone:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Update a drone */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      model_name,
      type,
      camera,
      payload_kg,
      flight_time_min,
      range_km,
      use_cases
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Drone ID is required" });
    }

    if (!model_name || !type) {
      return res.status(400).json({ 
        error: "Model name and type are required" 
      });
    }

    // Convert numeric fields
    const payloadKg = payload_kg ? parseFloat(payload_kg) : null;
    const flightTimeMin = flight_time_min ? parseInt(flight_time_min, 10) : null;
    const rangeKm = range_km ? parseFloat(range_km) : null;

    const result = await pool.query(`
      UPDATE drones SET
        model_name = $1,
        type = $2,
        camera = $3,
        max_payload_kg = $4,
        flight_time_min = $5,
        max_range_km = $6,
        use_cases = $7
      WHERE id = $8
      RETURNING *
    `, [
      model_name,
      type,
      camera || null,
      payloadKg,
      flightTimeMin,
      rangeKm,
      use_cases || [],
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drone not found" });
    }

    res.json(droneRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error updating drone:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
