const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/submit-inquiry", async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      company,
      message,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO contact_inquiries 
      (full_name, email, phone, company, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        full_name,
        email,
        phone || null,
        company || null,
        message,
      ]
    );

    res.status(200).json({
      message: "Contact inquiry submitted successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;