import { getPgPool } from "@/lib/pg-pool";

let requestSchemaEnsured = false;

function toTrimmed(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

async function ensureRequestSchema(): Promise<void> {
  if (requestSchemaEnsured) return;
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drone_hire_requests (
      id BIGSERIAL PRIMARY KEY,
      reason_or_title TEXT,
      pickup_location TEXT,
      drop_location TEXT,
      payload_weight TEXT,
      cargo_type TEXT,
      mission_urgency TEXT,
      admin_status VARCHAR(24) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const alters = [
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS reason_or_title TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS pickup_location TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS drop_location TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS payload_weight TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS cargo_type TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS mission_urgency TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS admin_status VARCHAR(24) NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS user_id TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS user_name TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS user_email TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS client_request_id TEXT`,
    `ALTER TABLE drone_hire_requests ADD COLUMN IF NOT EXISTS requirement_status VARCHAR(32)`,
  ];
  for (const sql of alters) {
    try {
      await pool.query(sql);
    } catch {
      /* column may already exist with incompatible type in legacy DBs */
    }
  }
  const widenColumns = [
    `ALTER TABLE drone_hire_requests ALTER COLUMN reason_or_title TYPE TEXT USING reason_or_title::text`,
    `ALTER TABLE drone_hire_requests ALTER COLUMN pickup_location TYPE TEXT USING pickup_location::text`,
    `ALTER TABLE drone_hire_requests ALTER COLUMN drop_location TYPE TEXT USING drop_location::text`,
    `ALTER TABLE drone_hire_requests ALTER COLUMN payload_weight TYPE TEXT USING payload_weight::text`,
    `ALTER TABLE drone_hire_requests ALTER COLUMN cargo_type TYPE TEXT USING cargo_type::text`,
    `ALTER TABLE drone_hire_requests ALTER COLUMN mission_urgency TYPE TEXT USING mission_urgency::text`,
  ];
  for (const sql of widenColumns) {
    try {
      await pool.query(sql);
    } catch {
      /* column may already be TEXT */
    }
  }
  requestSchemaEnsured = true;
}

export type DroneHireRequestRow = {
  id: number | string;
  reason_or_title: string | null;
  pickup_location: string | null;
  drop_location: string | null;
  payload_weight: string | null;
  cargo_type: string | null;
  mission_urgency: string | null;
  admin_status: string;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  client_request_id: string | null;
  requirement_status: string | null;
};

export type InsertDroneHireRequestInput = {
  reason_or_title: string;
  pickup_location: string;
  drop_location: string;
  payload_weight: string;
  cargo_type: string;
  mission_urgency: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  client_request_id?: string | null;
  requirement_status?: string | null;
};

export async function insertDroneHireRequest(
  input: InsertDroneHireRequestInput
): Promise<DroneHireRequestRow> {
  await ensureRequestSchema();
  const result = await getPgPool().query(
    `INSERT INTO drone_hire_requests
      (reason_or_title, pickup_location, drop_location, payload_weight, cargo_type, mission_urgency,
       user_id, user_name, user_email, client_request_id, requirement_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      input.reason_or_title,
      input.pickup_location,
      input.drop_location,
      input.payload_weight,
      input.cargo_type,
      input.mission_urgency,
      toTrimmed(input.user_id) || null,
      toTrimmed(input.user_name) || null,
      toTrimmed(input.user_email).toLowerCase() || null,
      toTrimmed(input.client_request_id) || null,
      toTrimmed(input.requirement_status) || null,
    ]
  );
  return result.rows[0] as DroneHireRequestRow;
}

export type DroneHireRequestRowWithMission = DroneHireRequestRow & {
  mission_status?: string | null;
};

export async function listDroneHireRequests(): Promise<
  DroneHireRequestRowWithMission[]
> {
  await ensureRequestSchema();
  const result = await getPgPool().query(
    `SELECT r.*,
        (
          SELECT m.status
          FROM missions m
          WHERE TRIM(COALESCE(m.request_ref, '')) = TRIM(r.id::text)
             OR (
               NULLIF(TRIM(COALESCE(r.client_request_id, '')), '') IS NOT NULL
               AND TRIM(COALESCE(m.request_ref, '')) = TRIM(r.client_request_id)
             )
          ORDER BY m.id DESC NULLS LAST
          LIMIT 1
        ) AS mission_status
     FROM drone_hire_requests r
     ORDER BY r.id DESC`
  );
  return result.rows as DroneHireRequestRowWithMission[];
}

export type UpdateDroneHireRequestInput = {
  reason_or_title?: string;
  pickup_location?: string;
  drop_location?: string;
  payload_weight?: string;
  cargo_type?: string;
  mission_urgency?: string;
  admin_status?: string;
  requirement_status?: string | null;
  user_name?: string | null;
  user_email?: string | null;
};

export async function updateDroneHireRequest(
  id: string,
  input: UpdateDroneHireRequestInput
): Promise<DroneHireRequestRow | null> {
  await ensureRequestSchema();
  const result = await getPgPool().query(
    `UPDATE drone_hire_requests
     SET reason_or_title = COALESCE($1, reason_or_title),
         pickup_location = COALESCE($2, pickup_location),
         drop_location = COALESCE($3, drop_location),
         payload_weight = COALESCE($4, payload_weight),
         cargo_type = COALESCE($5, cargo_type),
         mission_urgency = COALESCE($6, mission_urgency),
         admin_status = COALESCE($7, admin_status),
         requirement_status = COALESCE($8, requirement_status),
         user_name = COALESCE($9, user_name),
         user_email = COALESCE($10, user_email)
     WHERE id = $11
     RETURNING *`,
    [
      input.reason_or_title ?? null,
      input.pickup_location ?? null,
      input.drop_location ?? null,
      input.payload_weight ?? null,
      input.cargo_type ?? null,
      input.mission_urgency ?? null,
      input.admin_status ?? null,
      toTrimmed(input.requirement_status) || null,
      toTrimmed(input.user_name) || null,
      toTrimmed(input.user_email).toLowerCase() || null,
      id,
    ]
  );
  return (result.rows[0] as DroneHireRequestRow) ?? null;
}

export async function deleteDroneHireRequest(
  id: string
): Promise<boolean> {
  await ensureRequestSchema();
  const result = await getPgPool().query(
    `DELETE FROM drone_hire_requests WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
}
