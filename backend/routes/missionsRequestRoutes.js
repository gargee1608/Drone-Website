const express = require("express");
const router = express.Router();
const pool = require("../db");

async function ensureMissionRequestsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mission_requests (
      id BIGSERIAL PRIMARY KEY,
      mission_code TEXT NOT NULL,
      title TEXT NOT NULL,
      payout TEXT NOT NULL,
      description TEXT,
      payload TEXT,
      distance TEXT,
      posted TEXT,
      duration TEXT,
      aircraft_class TEXT,
      clearance TEXT,
      requirements TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT mission_requests_code_unique UNIQUE (mission_code)
    );
  `);
}

/**
 * Older DBs may already have `mission_requests` with a different shape; `CREATE TABLE IF NOT EXISTS`
 * does not add columns. Align columns so inserts succeed.
 */
async function ensureMissionRequestColumns() {
  await pool.query(`
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS mission_code TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS payout TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS payload TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS distance TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS posted TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS duration TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS aircraft_class TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS clearance TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS requirements TEXT;
    ALTER TABLE mission_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  try {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS mission_requests_mission_code_uidx
      ON mission_requests (mission_code)
    `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[mission-requests] unique index on mission_code:", msg);
  }
}

/** Matches Matching Hub “Available Missions” hardcoded list; written to DB when table is empty. */
const SEED_MISSIONS_REQUESTS = [
  {
    mission_code: "ML-9021",
    title: "Arctic Supply Drop",
    payout: "$4,200",
    description:
      "Urgent medical supply delivery to Northern Research Outpost. Requires high-altitude stability.",
    payload: "18.5 KG",
    distance: "340 KM",
    posted: "Posted 3 days ago · Priority tier",
    duration: "Est. flight legs 2h 15m · On-site 5–7 hours",
    aircraft_class: "L-3 heavy multi-rotor, cold-weather rated",
    clearance: "Controlled airspace coordination + arctic NOTAM",
    requirements:
      "Medical payload chain-of-custody logging, redundant GNSS, and documented high-altitude hover stability. Client requires pre-flight brief 24h before departure window.",
  },
  {
    mission_code: "TX-4402",
    title: "Urban LiDAR Scan",
    payout: "$1,850",
    description:
      "High-resolution 3D mapping of downtown infrastructure for city planning. Requires Grade-A stealth props.",
    payload: "2.2 KG",
    distance: "12 KM",
    posted: "Posted 1 week ago · Standard",
    duration: "Est. grid coverage 3–4 hours (multiple batteries)",
    aircraft_class: "L-1 compact quad, low-noise props",
    clearance: "Municipal low-altitude corridor permit (provided)",
    requirements:
      "Stealth-rated propellers, 5cm vertical accuracy spec, and delivery of raw point cloud + classified tiles within 48h of capture.",
  },
  {
    mission_code: "FF-1190",
    title: "Forest Fire Monitor",
    payout: "$2,900",
    description:
      "Night-ops thermal monitoring for active containment zones. Multi-spectrum gimbal required.",
    payload: "4.5 KG",
    distance: "88 KM",
    posted: "Posted 12 hours ago · Urgent",
    duration: "Night window only · 6h continuous monitoring blocks",
    aircraft_class: "L-3 with dual-sensor gimbal (thermal + RGB)",
    clearance: "Wildfire TFR coordination with incident command",
    requirements:
      "Night waiver on file, radiometric thermal calibration card, and ability to stream low-latency feed to ops channel during sorties.",
  },
  {
    mission_code: "OC-8821",
    title: "Offshore Rig Cargo",
    payout: "$6,100",
    description:
      "Heavy lift logistics for oil platform repair parts. Salt-spray protection and L-5 heavy lift cert essential.",
    payload: "42.0 KG",
    distance: "115 KM",
    posted: "Posted 5 days ago · Contract",
    duration: "Deck cycle 45m · Total op window 2 days",
    aircraft_class: "L-5 heavy lift, corrosion-resistant airframe",
    clearance: "Offshore helideck + maritime radio net",
    requirements:
      "L-5 certification proof, salt-spray IP rating documentation, and marine insurance rider naming the operator. Deck supervisor sign-off required before release.",
  },
];

async function seedMissionRequestsIfEmpty() {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS c FROM mission_requests"
  );
  const before = Number(rows[0]?.c ?? 0);
  if (before > 0) return 0;

  let inserted = 0;
  for (const m of SEED_MISSIONS_REQUESTS) {
    try {
      const r = await pool.query(
        `INSERT INTO mission_requests (
          mission_code, title, payout, description, payload, distance,
          posted, duration, aircraft_class, clearance, requirements
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          m.mission_code,
          m.title,
          m.payout,
          m.description,
          m.payload,
          m.distance,
          m.posted,
          m.duration,
          m.aircraft_class,
          m.clearance,
          m.requirements,
        ]
      );
      inserted += r.rowCount ?? 0;
    } catch (e) {
      if (e && typeof e === "object" && e.code === "23505") continue;
      throw e;
    }
  }
  return inserted;
}

/** If an older `missions_requests` table exists and `mission_requests` is empty, copy rows over. */
async function tryCopyFromLegacyMissionsRequestsTable() {
  try {
    const t = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'missions_requests'
      ) AS e
    `);
    if (!t.rows[0]?.e) return 0;
    const cnt = await pool.query(
      "SELECT COUNT(*)::int AS c FROM mission_requests"
    );
    if (Number(cnt.rows[0]?.c ?? 0) > 0) return 0;
    const r = await pool.query(`
      INSERT INTO mission_requests (
        mission_code, title, payout, description, payload, distance,
        posted, duration, aircraft_class, clearance, requirements
      )
      SELECT mission_code, title, payout, description, payload, distance,
             posted, duration, aircraft_class, clearance, requirements
      FROM missions_requests
    `);
    return r.rowCount ?? 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[mission-requests] legacy missions_requests copy skipped:", msg);
    return 0;
  }
}

/** Ensure table/columns exist — used on API requests (does not re-seed after admin deletes). */
async function ensureMissionRequestsReady() {
  await ensureMissionRequestsSchema();
  await ensureMissionRequestColumns();
}

/**
 * Run on server startup only. Seeds default hub missions when the table is empty
 * on first deploy; later empty state (all deleted) stays empty.
 */
async function bootstrapMissionRequests() {
  const db = await pool.query("SELECT current_database() AS name");
  const dbName = db.rows[0]?.name ?? "?";
  await ensureMissionRequestsReady();
  const copied = await tryCopyFromLegacyMissionsRequestsTable();
  if (copied > 0) {
    console.log(
      `[mission-requests] copied ${copied} row(s) from missions_requests → mission_requests (db=${dbName})`
    );
  }
  const seeded = await seedMissionRequestsIfEmpty();
  if (seeded > 0) {
    console.log(
      `[mission-requests] seeded ${seeded} row(s) into public.mission_requests (db=${dbName})`
    );
  }
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS c FROM mission_requests"
  );
  const total = Number(rows[0]?.c ?? 0);
  console.log(
    `[mission-requests] table public.mission_requests row count = ${total} (db=${dbName})`
  );
}

function rowToHubMission(row) {
  return {
    id: String(row.mission_code ?? ""),
    title: String(row.title ?? ""),
    payout: String(row.payout ?? ""),
    description: String(row.description ?? ""),
    payload: String(row.payload ?? ""),
    distance: String(row.distance ?? ""),
    posted: String(row.posted ?? ""),
    duration: String(row.duration ?? ""),
    aircraftClass: String(row.aircraft_class ?? ""),
    clearance: String(row.clearance ?? ""),
    requirements: String(row.requirements ?? ""),
  };
}

function hubMissionFromBody(body) {
  const src = body && typeof body === "object" ? body : {};
  return {
    mission_code: String(src.id ?? src.mission_code ?? "").trim(),
    title: String(src.title ?? "").trim(),
    payout: String(src.payout ?? "").trim(),
    description: String(src.description ?? "").trim(),
    payload: String(src.payload ?? "").trim(),
    distance: String(src.distance ?? "").trim(),
    posted: String(src.posted ?? "").trim(),
    duration: String(src.duration ?? "").trim(),
    aircraft_class: String(
      src.aircraftClass ?? src.aircraft_class ?? ""
    ).trim(),
    clearance: String(src.clearance ?? "").trim(),
    requirements: String(src.requirements ?? "").trim(),
  };
}

/** GET /api/missions-requests — all rows in mission_requests (may be empty). */
router.get("/", async (req, res) => {
  try {
    await ensureMissionRequestsReady();
    const result = await pool.query(
      `SELECT * FROM mission_requests ORDER BY id ASC`
    );
    const data = result.rows.map(rowToHubMission);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mission-requests]", msg);
    const detail =
      process.env.NODE_ENV !== "production" ? msg : undefined;
    return res.status(500).json({
      error: "Server error",
      ...(detail ? { detail } : {}),
    });
  }
});

/** POST /api/missions-requests — create a new mission_requests row. */
router.post("/", async (req, res) => {
  try {
    await ensureMissionRequestsReady();
    const fields = hubMissionFromBody(req.body);
    if (!fields.mission_code) {
      return res.status(400).json({ error: "Mission code is required" });
    }
    if (!fields.title || !fields.payout) {
      return res.status(400).json({ error: "Title and payout are required" });
    }

    const result = await pool.query(
      `INSERT INTO mission_requests (
        mission_code, title, payout, description, payload, distance,
        posted, duration, aircraft_class, clearance, requirements
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        fields.mission_code,
        fields.title,
        fields.payout,
        fields.description,
        fields.payload,
        fields.distance,
        fields.posted,
        fields.duration,
        fields.aircraft_class,
        fields.clearance,
        fields.requirements,
      ]
    );

    return res.status(201).json({
      success: true,
      data: rowToHubMission(result.rows[0]),
    });
  } catch (err) {
    if (err && typeof err === "object" && err.code === "23505") {
      return res.status(409).json({ error: "Mission code already exists" });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mission-requests] POST", msg);
    const detail =
      process.env.NODE_ENV !== "production" ? msg : undefined;
    return res.status(500).json({
      error: "Server error",
      ...(detail ? { detail } : {}),
    });
  }
});

/** PUT /api/missions-requests/:code — update by mission_code (body.id may rename code). */
router.put("/:code", async (req, res) => {
  const originalCode = decodeURIComponent(String(req.params.code ?? "")).trim();
  if (!originalCode) {
    return res.status(400).json({ error: "Mission code is required" });
  }

  try {
    await ensureMissionRequestsReady();
    const fields = hubMissionFromBody(req.body);
    if (!fields.mission_code) {
      return res.status(400).json({ error: "Mission code is required" });
    }
    if (!fields.title || !fields.payout) {
      return res.status(400).json({ error: "Title and payout are required" });
    }

    const result = await pool.query(
      `UPDATE mission_requests SET
        mission_code = $1,
        title = $2,
        payout = $3,
        description = $4,
        payload = $5,
        distance = $6,
        posted = $7,
        duration = $8,
        aircraft_class = $9,
        clearance = $10,
        requirements = $11
      WHERE mission_code = $12
      RETURNING *`,
      [
        fields.mission_code,
        fields.title,
        fields.payout,
        fields.description,
        fields.payload,
        fields.distance,
        fields.posted,
        fields.duration,
        fields.aircraft_class,
        fields.clearance,
        fields.requirements,
        originalCode,
      ]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    return res.status(200).json({
      success: true,
      data: rowToHubMission(result.rows[0]),
    });
  } catch (err) {
    if (err && typeof err === "object" && err.code === "23505") {
      return res.status(409).json({ error: "Mission code already exists" });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mission-requests] PUT", msg);
    const detail =
      process.env.NODE_ENV !== "production" ? msg : undefined;
    return res.status(500).json({
      error: "Server error",
      ...(detail ? { detail } : {}),
    });
  }
});

/** DELETE /api/missions-requests/:code */
router.delete("/:code", async (req, res) => {
  const code = decodeURIComponent(String(req.params.code ?? "")).trim();
  if (!code) {
    return res.status(400).json({ error: "Mission code is required" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM mission_requests WHERE mission_code = $1 RETURNING mission_code`,
      [code]
    );
    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mission-requests] DELETE", msg);
    const detail =
      process.env.NODE_ENV !== "production" ? msg : undefined;
    return res.status(500).json({
      error: "Server error",
      ...(detail ? { detail } : {}),
    });
  }
});

router.bootstrapMissionRequests = bootstrapMissionRequests;

module.exports = router;
