const express = require("express");
const router = express.Router();
const pool = require("../db");

// Fetch all user requests from DB (admin dashboard)
router.get("/requests", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM drone_hire_requests
       ORDER BY id DESC`
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
    const {
      reason_or_title,
      pickup_location,
      drop_location,
      payload_weight,
      cargo_type,
      mission_urgency,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO drone_hire_requests 
      (reason_or_title, pickup_location, drop_location, payload_weight, cargo_type, mission_urgency)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        reason_or_title,
        pickup_location,
        drop_location,
        payload_weight,
        cargo_type,
        mission_urgency,
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

module.exports = router;