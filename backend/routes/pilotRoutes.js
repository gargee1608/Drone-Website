const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");

const BCRYPT_ROUNDS = 10;

async function pilotPasswordMatches(plain, stored) {
  if (stored == null || stored === "") return false;
  const s = String(stored);
  if (s.startsWith("$2")) {
    try {
      return await bcrypt.compare(plain, s);
    } catch {
      return false;
    }
  }
  return plain === s;
}

router.post("/register", async (req, res) => {
    try {
      const { name, email, phone, experience, license_number, password } = req.body;
      const plain = password == null ? "" : String(password);
      if (!plain.trim()) {
        return res.status(400).json({ error: "Password is required" });
      }
      const passwordStored = await bcrypt.hash(plain, BCRYPT_ROUNDS);

      const result = await pool.query(
        `INSERT INTO pilots (name, email, phone, experience, license_number, password)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, email, phone, experience, license_number, passwordStored]
      );

      const row = result.rows[0];
      const { password: _omit, ...safe } = row;
      res.json({
        success: true,
        data: safe,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const email = String(req.body.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(req.body.password ?? "");

      const result = await pool.query(
        `SELECT * FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Pilot not found",
        });
      }

      const pilot = result.rows[0];
      const ok = await pilotPasswordMatches(password, pilot.password);
      if (!ok) {
        return res.status(401).json({
          success: false,
          message: "Pilot not found",
        });
      }

      const { password: _omit, ...safePilot } = result.rows[0];
      res.json({
        success: true,
        message: "Login successful",
        pilot: safePilot,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

module.exports = router;