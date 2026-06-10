const express = require("express");
const router = express.Router();
const pool = require("../db");

function toTrimmed(value) {
  if (value == null) return "";
  return String(value).trim();
}

/** When a mission is finalized, mirror completion on the linked hire request row. */
async function syncRequestAdminStatusCompleted(requestRef) {
  const ref = toTrimmed(requestRef);
  if (!ref) return;
  try {
    await pool.query(
      `UPDATE drone_hire_requests
       SET admin_status = 'completed'
       WHERE TRIM(id::text) = $1
          OR TRIM(COALESCE(client_request_id, '')) = $1`,
      [ref]
    );
  } catch (err) {
    console.warn("[missions] sync request completed:", err?.message ?? err);
  }
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

function readPilotCommentFromBody(body) {
  if (!body || typeof body !== "object") return "";
  return toTrimmed(body.pilotComment ?? body.pilot_comment);
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
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS user_name TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS user_email TEXT"
  );
  await pool.query(
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_comment TEXT"
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

/** Fill requester name/email on mission rows when not stored on insert. */
async function enrichMissionUserFields(rows) {
  if (!rows.length) return rows;
  const needLookup = rows.filter(
    (r) => !toTrimmed(r.user_name) || !toTrimmed(r.user_email)
  );
  if (!needLookup.length) return rows;

  const numericRefs = [
    ...new Set(
      needLookup
        .map((r) => toTrimmed(r.request_ref))
        .filter((ref) => /^\d+$/.test(ref))
    ),
  ];
  const emails = [
    ...new Set(
      needLookup
        .map((r) => toTrimmed(r.user_email).toLowerCase())
        .filter(Boolean)
    ),
  ];

  const usersById = new Map();
  const usersByEmail = new Map();

  if (numericRefs.length > 0) {
    const byId = await pool.query(
      `SELECT id, name, email FROM users WHERE id = ANY($1::bigint[])`,
      [numericRefs.map((id) => Number.parseInt(id, 10))]
    );
    for (const u of byId.rows) {
      usersById.set(String(u.id), u);
      if (u.email) {
        usersByEmail.set(String(u.email).trim().toLowerCase(), u);
      }
    }
  }
  if (emails.length > 0) {
    const byEmail = await pool.query(
      `SELECT id, name, email FROM users
       WHERE LOWER(TRIM(email::text)) = ANY($1::text[])`,
      [emails]
    );
    for (const u of byEmail.rows) {
      usersById.set(String(u.id), u);
      if (u.email) {
        usersByEmail.set(String(u.email).trim().toLowerCase(), u);
      }
    }
  }

  const clientRefs = [
    ...new Set(
      needLookup
        .map((r) => toTrimmed(r.request_ref))
        .filter((ref) => ref && !/^\d+$/.test(ref))
    ),
  ];
  const hireByRef = new Map();
  if (numericRefs.length > 0 || clientRefs.length > 0) {
    try {
      const hire = await pool.query(
        `SELECT id, client_request_id, user_id, user_name, user_email
         FROM drone_hire_requests
         WHERE id::text = ANY($1::text[])
            OR client_request_id = ANY($2::text[])`,
        [numericRefs, clientRefs]
      );
      for (const h of hire.rows) {
        hireByRef.set(String(h.id), h);
        const clientId = toTrimmed(h.client_request_id);
        if (clientId) hireByRef.set(clientId, h);
      }
    } catch (e) {
      console.warn("[missions] drone_hire_requests owner lookup:", e.message);
    }
  }

  return rows.map((row) => {
    const ref = toTrimmed(row.request_ref);
    const storedName = toTrimmed(row.user_name);
    const storedEmail = toTrimmed(row.user_email).toLowerCase();
    const hire = hireByRef.get(ref);
    const hireName = toTrimmed(hire?.user_name);
    const hireEmail = toTrimmed(hire?.user_email).toLowerCase();
    const hireUserId = toTrimmed(hire?.user_id);

    let user =
      (storedEmail && usersByEmail.get(storedEmail)) ||
      (hireEmail && usersByEmail.get(hireEmail)) ||
      (/^\d+$/.test(ref) ? usersById.get(ref) : null) ||
      (hireUserId && usersById.get(hireUserId)) ||
      null;
    if (!user && /^\d+$/.test(ref)) {
      user = usersById.get(ref);
    }
    if (!user && hireUserId) {
      user = usersById.get(hireUserId);
    }

    const name = storedName || hireName || toTrimmed(user?.name);
    const email =
      storedEmail ||
      hireEmail ||
      (user?.email ? String(user.email).trim().toLowerCase() : "");
    return {
      ...row,
      user_name: name || row.user_name || "",
      user_email: email || row.user_email || "",
    };
  });
}

/**
 * Count of mission rows treated as completed (same rule and optional pilot filter as GET /).
 * Query: pilotSub, pilotName — when both absent, counts all completed missions.
 */
/** All mission rows for this pilot (active assignments + completed). */
router.patch("/comment", async (req, res) => {
  try {
    await ensureMissionColumns();

    const pilotComment = toTrimmed(req.body?.pilotComment);
    const rawId = req.body?.id;
    const parsedId =
      rawId == null || rawId === "" ? NaN : Number.parseInt(String(rawId), 10);
    const rowCtid = toTrimmed(req.body?.rowCtid);
    const requestRef = toTrimmed(req.body?.requestRef);
    const pilotSub = toTrimmed(req.body?.pilotSub);

    if (!Number.isFinite(parsedId) && !rowCtid && !requestRef) {
      return res
        .status(400)
        .json({ error: "id, rowCtid, or requestRef is required" });
    }

    let result;
    if (Number.isFinite(parsedId)) {
      result = await pool.query(
        `UPDATE missions SET pilot_comment = NULLIF($1, '') WHERE id = $2 RETURNING *`,
        [pilotComment, parsedId]
      );
    } else if (rowCtid) {
      result = await pool.query(
        `UPDATE missions SET pilot_comment = NULLIF($1, '') WHERE ctid = $2::tid RETURNING *`,
        [pilotComment, rowCtid]
      );
    } else {
      const params = [pilotComment, requestRef];
      let pilotFilter = "";
      if (pilotSub) {
        pilotFilter = "AND TRIM(COALESCE(pilot_sub, '')) = $3";
        params.push(pilotSub);
      }
      result = await pool.query(
        `UPDATE missions SET pilot_comment = NULLIF($1, '')
         WHERE ctid = (
           SELECT ctid
           FROM missions
           WHERE request_ref = $2
             ${pilotFilter}
           ORDER BY
             CASE WHEN LOWER(COALESCE(status, 'completed')) = 'completed' THEN 0 ELSE 1 END,
             completed_at DESC NULLS LAST,
             id DESC
           LIMIT 1
         )
         RETURNING *`,
        params
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafeMissionRow(result.rows[0]),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/assigned-count", async (req, res) => {
  try {
    await ensureMissionColumns();
    const pilotSub = toTrimmed(req.query?.pilotSub);
    if (!pilotSub) {
      return res.status(400).json({ error: "pilotSub is required" });
    }
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM missions
       WHERE TRIM(COALESCE(pilot_sub, '')) = $1`,
      [pilotSub]
    );
    const count = Number(result.rows[0]?.count ?? 0);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * Count of all mission rows (any status). Optional pilotSub / pilotName filter
 * matches GET / and completed-deliveries-count.
 */
router.get("/total-deliveries-count", async (req, res) => {
  try {
    await ensureMissionColumns();
    const pilotSub = toTrimmed(req.query?.pilotSub);
    const pilotName = toTrimmed(req.query?.pilotName).toLowerCase();
    const result = pilotSub || pilotName
      ? await pool.query(
          `SELECT COUNT(*)::int AS count
           FROM missions
           WHERE (
             TRIM(COALESCE(pilot_sub, '')) = $1
             OR (
               $2 <> ''
               AND TRIM(COALESCE(pilot_sub, '')) = ''
               AND LOWER(TRIM(COALESCE(pilot_name, ''))) = $2
             )
           )`,
          [pilotSub, pilotName]
        )
      : await pool.query(`SELECT COUNT(*)::int AS count FROM missions`);
    const count = Number(result.rows[0]?.count ?? 0);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

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
    const enriched = await enrichMissionUserFields(result.rows);
    return res
      .status(200)
      .json({ success: true, data: enriched.map(jsonSafeMissionRow) });
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

router.put("/", async (req, res) => {
  try {
    await ensureMissionColumns();

    const rawId = req.body?.id;
    const parsedId =
      rawId == null || rawId === "" ? NaN : Number.parseInt(String(rawId), 10);
    const rowCtid = toTrimmed(req.body?.rowCtid);
    const requestRef = toTrimmed(req.body?.requestRef);
    const assignedAtRaw = toTrimmed(req.body?.assignedAt);
    const completedAtRaw = toTrimmed(req.body?.completedAt);
    const assignedAt = assignedAtRaw ? new Date(assignedAtRaw) : null;
    const completedAt = completedAtRaw ? new Date(completedAtRaw) : null;
    const status = toTrimmed(req.body?.status).toLowerCase().replace(/\s+/g, "_");
    const pilotComment = readPilotCommentFromBody(req.body);

    if (!Number.isFinite(parsedId) && !rowCtid) {
      return res.status(400).json({ error: "id or rowCtid is required" });
    }
    if (!requestRef) {
      return res.status(400).json({ error: "requestRef is required" });
    }
    if (assignedAtRaw && Number.isNaN(assignedAt.getTime())) {
      return res.status(400).json({ error: "assignedAt is invalid" });
    }
    if (completedAtRaw && Number.isNaN(completedAt.getTime())) {
      return res.status(400).json({ error: "completedAt is invalid" });
    }

    const values = [
      requestRef,
      toTrimmed(req.body?.customer),
      toTrimmed(req.body?.service),
      toTrimmed(req.body?.dropoff),
      toTrimmed(req.body?.pilotName),
      toTrimmed(req.body?.droneModel),
      toTrimmed(req.body?.userName),
      toTrimmed(req.body?.userEmail).toLowerCase(),
      assignedAt ? assignedAt.toISOString() : null,
      completedAt ? completedAt.toISOString() : null,
      status || "completed",
      pilotComment || null,
    ];

    const setClause = `SET
      request_ref = $1,
      customer = $2,
      service = NULLIF($3, ''),
      dropoff = NULLIF($4, ''),
      pilot_name = NULLIF($5, ''),
      drone_model = NULLIF($6, ''),
      user_name = NULLIF($7, ''),
      user_email = NULLIF($8, ''),
      assigned_at = $9::timestamptz,
      completed_at = $10::timestamptz,
      status = $11,
      pilot_comment = COALESCE(NULLIF($12, ''), pilot_comment)`;

    const result = Number.isFinite(parsedId)
      ? await pool.query(
          `UPDATE missions ${setClause} WHERE id = $13 RETURNING *`,
          [...values, parsedId]
        )
      : await pool.query(
          `UPDATE missions ${setClause} WHERE ctid = $13::tid RETURNING *`,
          [...values, rowCtid]
        );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    return res.status(200).json({
      success: true,
      data: jsonSafeMissionRow(result.rows[0]),
    });
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
    const userName = toTrimmed(req.body?.userName);
    const userEmail = toTrimmed(req.body?.userEmail).toLowerCase();
    const droneModel = toTrimmed(req.body?.droneModel);
    const assignedAtRaw = toTrimmed(req.body?.assignedAt);
    const assignedAt = assignedAtRaw ? new Date(assignedAtRaw) : new Date();
    const pilotComment = readPilotCommentFromBody(req.body);
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
          user_name = COALESCE(NULLIF(TRIM($9), ''), user_name),
          user_email = COALESCE(NULLIF(TRIM($10), ''), user_email),
          completed_at = NOW(),
          status = 'completed',
          pilot_comment = COALESCE(NULLIF(TRIM($12), ''), pilot_comment)
        WHERE request_ref = $1
          AND TRIM(COALESCE(pilot_sub, '')) = $7
          AND LOWER(TRIM(COALESCE(status, ''))) = ANY($11::text[])
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
          userName || null,
          userEmail || null,
          ACTIVE_ASSIGNMENT_STATUSES,
          pilotComment || null,
        ]
      );
      if (updated.rowCount > 0) {
        await syncRequestAdminStatusCompleted(requestRef);
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
        user_name,
        user_email,
        assigned_at,
        completed_at,
        status,
        pilot_comment
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
        userName || null,
        userEmail || null,
        assignedAt.toISOString(),
        completedAt,
        status,
        pilotComment || null,
      ]
    );

    if (status === "completed") {
      await syncRequestAdminStatusCompleted(requestRef);
    }

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

