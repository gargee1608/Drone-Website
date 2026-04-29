const express = require("express");
const router = express.Router();
const pool = require("../db");

function toTrimmed(value) {
  if (value == null) return "";
  return String(value).trim();
}

async function ensureMissionColumns() {
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS id BIGSERIAL"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS request_ref TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS customer TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS service TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS dropoff TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_name TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_badge_id TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_sub TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS drone_model TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'"
  );
}

/**
 * Count of mission rows treated as completed (same rule and optional pilot filter as GET /).
 * Query: pilotSub, pilotName — when both absent, counts all completed missions.
 */
router.get("/completed-deliveries-count", async (req, res) => {
  try {
    await ensureMissionColumns();
    const pilotSub = toTrimmed(req.query?.pilotSub);
    const pilotName = toTrimmed(req.query?.pilotName).toLowerCase();
    const result = pilotSub || pilotName
      ? await pool.query(
          `SELECT COUNT(*)::int AS count
           FROM missions
           WHERE LOWER(COALESCE(status, 'completed')) = 'completed'
             AND (
               TRIM(COALESCE(pilot_sub, '')) = $1
               OR (
                 $2 <> ''
                 AND TRIM(COALESCE(pilot_sub, '')) = ''
                 AND LOWER(TRIM(COALESCE(pilot_name, ''))) = $2
               )
             )`,
          [pilotSub, pilotName]
        )
      : await pool.query(
          `SELECT COUNT(*)::int AS count
           FROM missions
           WHERE LOWER(COALESCE(status, 'completed')) = 'completed'`
        );
    const count = Number(result.rows[0]?.count ?? 0);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    await ensureMissionColumns();
    const pilotSub = toTrimmed(req.query?.pilotSub);
    const pilotName = toTrimmed(req.query?.pilotName).toLowerCase();
    const result = pilotSub || pilotName
      ? await pool.query(
          `SELECT ctid::text AS row_ctid, *
           FROM missions
           WHERE LOWER(COALESCE(status, 'completed')) = 'completed'
             AND (
               TRIM(COALESCE(pilot_sub, '')) = $1
               OR (
                 $2 <> ''
                 AND TRIM(COALESCE(pilot_sub, '')) = ''
                 AND LOWER(TRIM(COALESCE(pilot_name, ''))) = $2
               )
             )
           ORDER BY completed_at DESC`,
          [pilotSub, pilotName]
        )
      : await pool.query(
          `SELECT ctid::text AS row_ctid, *
           FROM missions
           WHERE LOWER(COALESCE(status, 'completed')) = 'completed'
           ORDER BY completed_at DESC`
        );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await ensureMissionColumns();

    const rawId = req.body?.id;
    const parsedId =
      rawId == null || rawId === "" ? NaN : Number.parseInt(String(rawId), 10);
    if (Number.isFinite(parsedId)) {
      const result = await pool.query(
        `DELETE FROM missions WHERE id = $1 RETURNING *`,
        [parsedId]
      );
      if (result.rowCount > 0) {
        return res.status(200).json({ success: true });
      }
    }

    const rowCtid = toTrimmed(req.body?.rowCtid);
    if (rowCtid) {
      const result = await pool.query(
        `DELETE FROM missions WHERE ctid = $1::tid RETURNING *`,
        [rowCtid]
      );
      if (result.rowCount > 0) {
        return res.status(200).json({ success: true });
      }
    }

    const requestRef = toTrimmed(req.body?.requestRef);
    const completedAtRaw = toTrimmed(req.body?.completedAt);
    if (requestRef && completedAtRaw) {
      const completedAt = new Date(completedAtRaw);
      if (!Number.isNaN(completedAt.getTime())) {
        const result = await pool.query(
          `DELETE FROM missions
           WHERE ctid IN (
             SELECT ctid
             FROM missions
             WHERE request_ref = $1 AND completed_at = $2::timestamptz
             LIMIT 1
           )
           RETURNING *`,
          [requestRef, completedAt.toISOString()]
        );
        if (result.rowCount > 0) {
          return res.status(200).json({ success: true });
        }
      }
    }

    return res.status(404).json({ error: "Mission not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    await ensureMissionColumns();

    const requestRef = toTrimmed(req.body?.requestRef);
    const customer = toTrimmed(req.body?.customer);
    const service = toTrimmed(req.body?.service);
    const dropoff = toTrimmed(req.body?.dropoff);
    const pilotName = toTrimmed(req.body?.pilotName);
    const pilotBadgeId = toTrimmed(req.body?.pilotBadgeId);
    const pilotSub = toTrimmed(req.body?.pilotSub);
    const droneModel = toTrimmed(req.body?.droneModel);
    const assignedAtRaw = toTrimmed(req.body?.assignedAt);
    const assignedAt = assignedAtRaw ? new Date(assignedAtRaw) : new Date();
    const statusNorm = toTrimmed(req.body?.status).toLowerCase().replace(/\s+/g, "_");
    let status = "completed";
    if (statusNorm === "in_progress") status = "in_progress";
    else if (statusNorm === "pending") status = "pending";
    else if (
      statusNorm === "rejected" ||
      statusNorm === "cancelled" ||
      statusNorm === "canceled"
    ) {
      status = "rejected";
    } else if (statusNorm === "completed" || statusNorm === "") {
      status = "completed";
    }

    if (!requestRef) {
      return res.status(400).json({ error: "requestRef is required" });
    }
    if (!customer) {
      return res.status(400).json({ error: "customer is required" });
    }
    if (Number.isNaN(assignedAt.getTime())) {
      return res.status(400).json({ error: "assignedAt is invalid" });
    }

    const result = await pool.query(
      `INSERT INTO missions (
        request_ref,
        customer,
        service,
        dropoff,
        pilot_name,
        pilot_badge_id,
        pilot_sub,
        drone_model,
        assigned_at,
        completed_at,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10)
      RETURNING *`,
      [
        requestRef,
        customer,
        service || null,
        dropoff || null,
        pilotName || null,
        pilotBadgeId || null,
        pilotSub || null,
        droneModel || null,
        assignedAt.toISOString(),
        status,
      ]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

