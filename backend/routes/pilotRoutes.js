const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");

const BCRYPT_ROUNDS = 10;

/** Express `res.json` cannot serialize `bigint` (PG BIGSERIAL / BIGINT). */
function pilotJsonValue(v) {
  if (typeof v === "bigint") {
    return v <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(v)
      : v.toString();
  }
  return v;
}

/** Safe pilot row for JSON: drop password, coerce bigint fields. */
function pilotRowForJson(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "password") continue;
    out[k] = pilotJsonValue(v);
  }
  return out;
}

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

async function ensurePilotDroneDetailsColumn() {
  await pool.query(
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS drone_details JSONB NOT NULL DEFAULT '[]'::jsonb"
  );
}

function normalizePilotDroneDetails(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item;
    const useCasesRaw = Array.isArray(o.useCases) ? o.useCases : [];
    const useCases = useCasesRaw
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);
    out.push({
      id: String(o.id ?? "").trim().slice(0, 120),
      modelName: String(o.modelName ?? "").trim().slice(0, 120),
      type: String(o.type ?? "").trim().slice(0, 120),
      camera: String(o.camera ?? "").trim().slice(0, 120),
      payloadKg: String(o.payloadKg ?? "").trim().slice(0, 40),
      flightTimeMin: String(o.flightTimeMin ?? "").trim().slice(0, 40),
      rangeKm: String(o.rangeKm ?? "").trim().slice(0, 40),
      useCases,
    });
    if (out.length >= 50) break;
  }
  return out;
}

router.post("/register", async (req, res) => {
    try {
      const { name, email, phone, experience, license_number, password } = req.body;
      const plain = password == null ? "" : String(password);
      if (!plain.trim()) {
        return res.status(400).json({ error: "Password is required" });
      }
      const passwordStored = await bcrypt.hash(plain, BCRYPT_ROUNDS);
      const expStr =
        experience == null ? "" : String(experience).trim();
      const expDigits = expStr.replace(/,/g, "");
      const initialFlightHours = /^[0-9]+$/.test(expDigits)
        ? Math.min(50000, Math.max(0, parseInt(expDigits, 10)))
        : 0;

      const result = await pool.query(
        `INSERT INTO pilots (name, email, phone, experience, license_number, password, flight_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          name,
          email,
          phone,
          experience,
          license_number,
          passwordStored,
          initialFlightHours,
        ]
      );

      const row = result.rows[0];
      res.json({
        success: true,
        data: pilotRowForJson(row),
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

      res.json({
        success: true,
        message: "Login successful",
        pilot: pilotRowForJson(result.rows[0]),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pilots");

    res.json(result.rows.map((r) => pilotRowForJson(r)));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid pilot id" });
    }

    const result = await pool.query(`SELECT * FROM pilots WHERE id = $1`, [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pilot not found" });
    }

    res.json(pilotRowForJson(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Increment completed-mission counter (e.g. after a delivery is finalized). */
router.post("/:id/missions/increment", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid pilot id" });
    }

    const rawDelta = req.body?.delta;
    const delta =
      rawDelta == null || rawDelta === ""
        ? 1
        : Number.parseInt(String(rawDelta), 10);
    if (!Number.isFinite(delta) || delta < 1 || delta > 500) {
      return res
        .status(400)
        .json({ error: "delta must be a number from 1 to 500" });
    }

    const result = await pool.query(
      `UPDATE pilots
       SET missions_completed = GREATEST(0, COALESCE(missions_completed, 0) + $1)
       WHERE id = $2
       RETURNING *`,
      [delta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pilot not found" });
    }

    res.json({ success: true, data: pilotRowForJson(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid pilot id" });
    }

    const raw = String(req.body?.dutyStatus ?? "").toUpperCase().trim();
    if (raw !== "ACTIVE" && raw !== "INACTIVE") {
      return res
        .status(400)
        .json({ error: "dutyStatus must be ACTIVE or INACTIVE" });
    }

    const result = await pool.query(
      `UPDATE pilots
       SET duty_status = $1
       WHERE id = $2
       RETURNING *`,
      [raw, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pilot not found" });
    }

    res.json({ success: true, data: pilotRowForJson(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Update pilot profile fields used by dashboards (keeps `experience` numeric string in sync). */
router.patch("/:id/details", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid pilot id" });
    }

    const rawH = req.body?.flightHours ?? req.body?.flight_hours;
    if (rawH == null || rawH === "") {
      return res.status(400).json({ error: "flightHours is required" });
    }
    const hrs = Math.floor(Number(rawH));
    if (!Number.isFinite(hrs) || hrs < 0 || hrs > 50000) {
      return res
        .status(400)
        .json({ error: "flightHours must be a number from 0 to 50000" });
    }

    const expStr = String(hrs);

    const result = await pool.query(
      `UPDATE pilots
       SET flight_hours = $1, experience = $2
       WHERE id = $3
       RETURNING *`,
      [hrs, expStr, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pilot not found" });
    }

    res.json({ success: true, data: pilotRowForJson(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Save Pilot Dashboard profile drone details onto the `pilots` row. */
router.patch("/:id/drones", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid pilot id" });
    }
    const normalized = normalizePilotDroneDetails(req.body?.drones);
    await ensurePilotDroneDetailsColumn();
    const result = await pool.query(
      `UPDATE pilots
       SET drone_details = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(normalized), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pilot not found" });
    }
    return res.json({ success: true, data: pilotRowForJson(result.rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;