import { getPgPool } from "@/lib/pg-pool";

async function ensurePilotDutyStatusColumn() {
  const pool = getPgPool();
  await pool.query(
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'ACTIVE'"
  );
}

/** Rows in `pilots` with `duty_status` ACTIVE (same rule as Express `GET /api/pilots/active-count`). */
export async function queryActivePilotsCount(): Promise<number> {
  await ensurePilotDutyStatusColumn();
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM pilots
     WHERE UPPER(TRIM(COALESCE(duty_status, 'ACTIVE'))) = 'ACTIVE'`
  );
  const count = Number(result.rows[0]?.count ?? 0);
  return Number.isFinite(count) ? count : 0;
}

/** All rows in `pilots` (any duty status). */
export async function queryTotalPilotsCount(): Promise<number> {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM pilots`
  );
  const count = Number(result.rows[0]?.count ?? 0);
  return Number.isFinite(count) ? count : 0;
}
