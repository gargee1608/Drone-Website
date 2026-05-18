const express = require("express");
const router = express.Router();
const pool = require("../db");

let requestSchemaEnsured = false;

function toTrimmed(value) {
  if (value == null) return "";
  return String(value).trim();
}

async function ensureRequestSchema() {
  if (requestSchemaEnsured) return;
  await pool.query(`
    ALTER TABLE drone_hire_requests
    ADD COLUMN IF NOT EXISTS admin_status VARCHAR(24) NOT NULL DEFAULT 'pending'
  `);
  await pool.query(`
    ALTER TABLE drone_hire_requests
    ADD COLUMN IF NOT EXISTS user_id TEXT
  `);
  await pool.query(`
    ALTER TABLE drone_hire_requests
    ADD COLUMN IF NOT EXISTS user_name TEXT
  `);
  await pool.query(`
    ALTER TABLE drone_hire_requests
    ADD COLUMN IF NOT EXISTS user_email TEXT
  `);
  await pool.query(`
    ALTER TABLE drone_hire_requests
    ADD COLUMN IF NOT EXISTS client_request_id TEXT
  `);
  requestSchemaEnsured = true;
}

// Fetch all user requests from DB (admin dashboard), with latest mission status per request
router.get("/requests", async (_req, res) => {
  try {
    await ensureRequestSchema();
    const result = await pool.query(
      `SELECT r.*,
        (
          SELECT m.status
          FROM missions m
          WHERE TRIM(COALESCE(m.request_ref, '')) = TRIM(r.id::text)
             OR (
               NULLIF(TRIM(COALESCE(r.client_request_id, '')), '') IS NOT NULL
               AND TRIM(COALESCE(m.request_ref, '')) = TRIM(r.client_request_id)
             )
          ORDER BY m.id DESC NULLS LAST
          LIMIT 1
        ) AS mission_status
       FROM drone_hire_requests r
       ORDER BY r.id DESC`
    );
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Submit request API
router.post("/submit-request", async (req, res) => {
  try {
    await ensureRequestSchema();
    const {
      reason_or_title,
      pickup_location,
      drop_location,
      payload_weight,
      cargo_type,
      mission_urgency,
      user_id,
      user_name,
      user_email,
      client_request_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO drone_hire_requests 
      (reason_or_title, pickup_location, drop_location, payload_weight, cargo_type, mission_urgency,
       user_id, user_name, user_email, client_request_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        reason_or_title,
        pickup_location,
        drop_location,
        payload_weight,
        cargo_type,
        mission_urgency,
        toTrimmed(user_id) || null,
        toTrimmed(user_name) || null,
        toTrimmed(user_email).toLowerCase() || null,
        toTrimmed(client_request_id) || null,
      ]
    );

    res.status(200).json({
      message: "Request saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Edit request row by id (admin user request table)
router.put("/requests/:id", async (req, res) => {
  try {
    await ensureRequestSchema();
    const { id } = req.params;
    const {
      reason_or_title,
      pickup_location,
      drop_location,
      payload_weight,
      cargo_type,
      mission_urgency,
      admin_status,
    } = req.body ?? {};

    const result = await pool.query(
      `UPDATE drone_hire_requests
       SET reason_or_title = COALESCE($1, reason_or_title),
           pickup_location = COALESCE($2, pickup_location),
           drop_location = COALESCE($3, drop_location),
           payload_weight = COALESCE($4, payload_weight),
           cargo_type = COALESCE($5, cargo_type),
           mission_urgency = COALESCE($6, mission_urgency),
           admin_status = COALESCE($7, admin_status)
       WHERE id = $8
       RETURNING *`,
      [
        reason_or_title ?? null,
        pickup_location ?? null,
        drop_location ?? null,
        payload_weight ?? null,
        cargo_type ?? null,
        mission_urgency ?? null,
        admin_status ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.status(200).json({ message: "Request updated", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete request row by id (admin user request table)
router.delete("/requests/:id", async (req, res) => {
  try {
    await ensureRequestSchema();
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM drone_hire_requests
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.status(200).json({ message: "Request deleted", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;