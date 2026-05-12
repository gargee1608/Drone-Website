const express = require("express");
const router = express.Router();
const pool = require("../db");

/** Express `res.json` cannot serialize `bigint` (PG BIGSERIAL / BIGINT). */
function userJsonValue(v) {
  if (typeof v === "bigint") {
    return v <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(v)
      : v.toString();
  }
  return v;
}

/** Safe user row for JSON: drop password, coerce bigint fields. */
function userRowForJson(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "password") continue;
    out[k] = userJsonValue(v);
  }
  return out;
}

/** Get all users */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows.map(userRowForJson));
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Get user by ID */
router.get("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Create new user */
router.post("/", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [email.trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        email.trim(),
        password,
        name || null,
        role || "user"
      ]
    );

    res.status(201).json(userRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Update user */
router.put("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE id = $1", [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND id != $2",
        [email.trim(), id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: "User with this email already exists" });
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email.trim());
    }
    if (password !== undefined) {
      updateFields.push(`password = $${paramIndex++}`);
      updateValues.push(password);
    }
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateValues.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json(userRowForJson(result.rows[0]));
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Delete user */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, email, name",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Search users by email or name */
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query.trim();
    
    if (query.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(email) LIKE LOWER($1) 
          OR LOWER(name) LIKE LOWER($1)
       ORDER BY 
         CASE 
           WHEN LOWER(email) LIKE LOWER($1) THEN 1 
           ELSE 2 
         END,
         email
       LIMIT 20`,
      [`%${query}%`]
    );

    res.json(result.rows.map(userRowForJson));
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
