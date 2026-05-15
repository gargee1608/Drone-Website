const express = require("express");
const router = express.Router();
const pool = require("../db");

async function ensureUserRequestsSchema() {
  // Ensure pilots table exists first (required for foreign key constraint)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pilots (
      id BIGSERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      experience TEXT,
      license_number TEXT,
      password TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_requests (
      id BIGSERIAL PRIMARY KEY,
      pilot_id BIGINT REFERENCES pilots(id) ON DELETE SET NULL,
      pilot_name TEXT,
      request_type TEXT NOT NULL,
      description TEXT,
      pilot_details JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  
  // Add columns if they don't exist
  const alters = [
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS pilot_id BIGINT REFERENCES pilots(id) ON DELETE SET NULL",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS pilot_name TEXT",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS description TEXT",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS pilot_details JSONB",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  ];
  
  for (const sql of alters) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.warn("  [skip] user_requests:", e.message);
    }
  }
}

// Create a new user request
router.post("/user-requests", async (req, res) => {
  try {
    await ensureUserRequestsSchema();
    
    const { pilot_id, pilot_name, request_type, description, pilot_details, status = 'pending' } = req.body;
    
    if (!pilot_id || !request_type || !description) {
      return res.status(400).json({ 
        error: "pilot_id, request_type, and description are required" 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO user_requests (pilot_id, pilot_name, request_type, description, pilot_details, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [pilot_id, pilot_name, request_type, description, JSON.stringify(pilot_details), status]
    );
    
    res.status(201).json({
      message: "User request created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating user request:", error);
    console.error("Error details:", error.message, error.code);
    res.status(500).json({ error: "Failed to create user request", detail: error.message });
  }
});

// Get all user requests (for admin)
router.get("/user-requests", async (req, res) => {
  try {
    await ensureUserRequestsSchema();
    
    const result = await pool.query(
      `SELECT ur.*, p.name as pilot_name, p.email as pilot_email
       FROM user_requests ur
       LEFT JOIN pilots p ON ur.pilot_id = p.id
       ORDER BY ur.created_at DESC`
    );
    
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ error: "Failed to fetch user requests" });
  }
});

// Get user requests by pilot ID
router.get("/user-requests/pilot/:pilotId", async (req, res) => {
  try {
    await ensureUserRequestsSchema();
    
    const { pilotId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM user_requests 
       WHERE pilot_id = $1 
       ORDER BY created_at DESC`,
      [pilotId]
    );
    
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error fetching pilot user requests:", error);
    res.status(500).json({ error: "Failed to fetch user requests" });
  }
});

// Update user request status
router.put("/user-requests/:id", async (req, res) => {
  try {
    await ensureUserRequestsSchema();
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        error: "status is required" 
      });
    }
    
    const result = await pool.query(
      `UPDATE user_requests 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User request not found" });
    }
    
    res.status(200).json({
      message: "User request updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating user request:", error);
    res.status(500).json({ error: "Failed to update user request" });
  }
});

// Delete user request
router.delete("/user-requests/:id", async (req, res) => {
  try {
    await ensureUserRequestsSchema();
    
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM user_requests 
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User request not found" });
    }
    
    res.status(200).json({
      message: "User request deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user request:", error);
    res.status(500).json({ error: "Failed to delete user request" });
  }
});

module.exports = router;
