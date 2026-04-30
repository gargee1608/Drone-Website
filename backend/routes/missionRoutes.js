const express = require("express");
const router = express.Router();
const pool = require("../db");

function toTrimmed(value) {
  if (value == null) return "";
  return String(value).trim();
}

function jsonSafeMissionRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = { ...row };
  if (typeof out.id === "bigint") {
    out.id =
      out.id <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(out.id)
        : out.id.toString();
  }
  return out;
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
  try {
    await pool.query(
      "ALTER TABLE missions ALTER COLUMN completed_at DROP NOT NULL"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[missions] completed_at nullable:", msg);
  }
}

const ACTIVE_ASSIGNMENT_STATUSES = ["assigned", "pending", "in_progress"];

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

/** Active hub / roster assignments for a pilot (not yet completed). */
router.get("/pending-assignments", async (req, res) => {
  try {
    await ensureMissionColumns();
    const pilotSub = toTrimmed(req.query?.pilotSub);
    if (!pilotSub) {
      return res.status(400).json({ error: "pilotSub is required" });
    }
    const result = await pool.query(
      `SELECT *
       FROM missions
       WHERE TRIM(COALESCE(pilot_sub, '')) = $1
         AND LOWER(TRIM(COALESCE(status, ''))) = ANY($2::text[])
       ORDER BY assigned_at DESC NULLS LAST, id DESC`,
      [pilotSub, ACTIVE_ASSIGNMENT_STATUSES]
    );
    const data = result.rows.map(jsonSafeMissionRow);
    return res.status(200).json({ success: true, data });
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
    return res
      .status(200)
      .json({ success: true, data: result.rows.map(jsonSafeMissionRow) });
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
    else if (statusNorm === "assigned") status = "assigned";
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

    if (status === "completed" && pilotSub) {
      const updated = await pool.query(
        `UPDATE missions SET
          customer = $2,
          service = $3,
          dropoff = $4,
          pilot_name = COALESCE(NULLIF(TRIM($5), ''), pilot_name),
          pilot_badge_id = COALESCE(NULLIF(TRIM($6), ''), pilot_badge_id),
          pilot_sub = COALESCE(NULLIF(TRIM($7), ''), pilot_sub),
          drone_model = COALESCE(NULLIF(TRIM($8), ''), drone_model),
          completed_at = NOW(),
          status = 'completed'
        WHERE request_ref = $1
          AND TRIM(COALESCE(pilot_sub, '')) = $7
          AND LOWER(TRIM(COALESCE(status, ''))) = ANY($9::text[])
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
          ACTIVE_ASSIGNMENT_STATUSES,
        ]
      );
      if (updated.rowCount > 0) {
        return res.status(200).json({
          success: true,
          data: jsonSafeMissionRow(updated.rows[0]),
          updated: true,
        });
      }
    }

    if (
      ACTIVE_ASSIGNMENT_STATUSES.includes(status) &&
      pilotSub
    ) {
      const dup = await pool.query(
        `SELECT * FROM missions
         WHERE request_ref = $1
           AND TRIM(COALESCE(pilot_sub, '')) = $2
           AND LOWER(TRIM(COALESCE(status, ''))) = ANY($3::text[])
         LIMIT 1`,
        [requestRef, pilotSub, ACTIVE_ASSIGNMENT_STATUSES]
      );
      if (dup.rows[0]) {
        return res.status(200).json({
          success: true,
          data: jsonSafeMissionRow(dup.rows[0]),
          alreadyAssigned: true,
        });
      }
    }

    const completedAt =
      status === "completed" ? new Date().toISOString() : null;

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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
        completedAt,
        status,
      ]
    );

    return res.status(201).json({
      success: true,
      data: jsonSafeMissionRow(result.rows[0]),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

