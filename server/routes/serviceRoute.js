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


// ✅ ADD new service
router.post("/", async (req, res) => {
  const { title, description, price } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO services (title, description, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, price, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;