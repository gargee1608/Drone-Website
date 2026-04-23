const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, experience, license_number, password } = req.body;

    const result = await pool.query(
      `INSERT INTO pilots (name, email, phone, experience, license_number, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, experience, license_number, password]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;