/**
 * migrate.js — Run all DB migrations without starting the HTTP server.
 * Usage:
 *   node scripts/migrate.js                        (uses .env)
 *   node scripts/migrate.js --env .env.production  (uses custom env file)
 */

const path = require("path");
const args = process.argv.slice(2);
const envFlagIdx = args.indexOf("--env");
const envFile =
  envFlagIdx !== -1 && args[envFlagIdx + 1]
    ? path.resolve(__dirname, "..", args[envFlagIdx + 1])
    : path.resolve(__dirname, "..", ".env");

require("dotenv").config({ path: envFile });
console.log(`\n[migrate] Loaded env: ${envFile}`);

const pool = require("../db");

// ─── 1. users / admins / pilots ──────────────────────────────────────────────
async function migrateAuthSchema() {
  console.log("\n[migrate] → users table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user'
    );
  `);

  console.log("[migrate] → admins table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      name TEXT
    );
  `);

  console.log("[migrate] → pilots table");
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

  console.log("[migrate] → pilots: ADD COLUMN IF NOT EXISTS (backfills)");
  const pilotAlters = [
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS password TEXT",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'ACTIVE'",
    "UPDATE pilots SET duty_status = 'ACTIVE' WHERE duty_status IS NULL OR TRIM(COALESCE(duty_status, '')) = ''",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS missions_completed INTEGER NOT NULL DEFAULT 0",
    "UPDATE pilots SET missions_completed = 0 WHERE missions_completed IS NULL",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS flight_hours INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS safety_rating NUMERIC(6,2) NOT NULL DEFAULT 99.50",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS experience_rank TEXT",
    "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS drone_details JSONB NOT NULL DEFAULT '[]'::jsonb",
  ];
  for (const sql of pilotAlters) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.warn("  [skip]", e.message);
    }
  }
  console.log("[migrate] ✓ auth schema done");
}

// ─── 2. drones ───────────────────────────────────────────────────────────────
async function migrateDroneSchema() {
  console.log("\n[migrate] → drones table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drones (
      id BIGSERIAL PRIMARY KEY,
      pilot_id BIGINT REFERENCES pilots(id) ON DELETE SET NULL,
      model_name TEXT NOT NULL,
      serial_number TEXT,
      max_payload_kg NUMERIC(10, 2) NOT NULL DEFAULT 15,
      max_range_km NUMERIC(10, 2) NOT NULL DEFAULT 80,
      flight_time_min INTEGER NOT NULL DEFAULT 40,
      battery_percent INTEGER NOT NULL DEFAULT 90,
      firmware TEXT,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'ready',
      subtitle TEXT
    );
  `);
  console.log("[migrate] ✓ drones schema done");
}

// ─── 3. missions ─────────────────────────────────────────────────────────────
async function migrateMissionSchema() {
  console.log("\n[migrate] → missions table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS missions (
      id BIGSERIAL PRIMARY KEY,
      request_ref TEXT NOT NULL,
      customer TEXT NOT NULL,
      service TEXT,
      dropoff TEXT,
      pilot_name TEXT,
      pilot_badge_id TEXT,
      pilot_sub TEXT,
      drone_model TEXT,
      assigned_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'completed'
    );
  `);
  const missionAlters = [
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS request_ref TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS customer TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS service TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS dropoff TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_name TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_badge_id TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS pilot_sub TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS drone_model TEXT",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "ALTER TABLE missions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'",
  ];
  for (const sql of missionAlters) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.warn("  [skip]", e.message);
    }
  }
  console.log("[migrate] ✓ missions schema done");
}

// ─── 4. phone_otps ───────────────────────────────────────────────────────────
async function migratePhoneOtpSchema() {
  console.log("\n[migrate] → phone_otps table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS phone_otps (
      id BIGSERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const otpAlters = [
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS otp_hash TEXT",
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ",
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
  ];
  for (const sql of otpAlters) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.warn("  [skip]", e.message);
    }
  }
  console.log("[migrate] ✓ phone_otps schema done");
}

// ─── 5. email_password_reset_otps ────────────────────────────────────────────
async function migrateEmailResetSchema() {
  console.log("\n[migrate] → email_password_reset_otps table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_password_reset_otps (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      account_role TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("[migrate] ✓ email_password_reset_otps schema done");
}

// ─── 6. mission_requests ─────────────────────────────────────────────────────
async function migrateMissionRequestsSchema() {
  console.log("\n[migrate] → mission_requests table");
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
    console.warn("  [skip] unique index:", e.message);
  }
  console.log("[migrate] ✓ mission_requests schema done");
}

// ─── 7. services ─────────────────────────────────────────────────────────────
async function migrateServicesSchema() {
  console.log("\n[migrate] → services table");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price TEXT,
      image TEXT
    );
  `);
  console.log("[migrate] ✓ services schema done");
}

// ─── 8. seed admin ─────────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log("\n[migrate] → seed admin user");
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("admin123", 10);
  const ins = await pool.query(
    `INSERT INTO admins (email, password, name)
     SELECT $1::text, $2::text, $3::text
     WHERE NOT EXISTS (
       SELECT 1 FROM admins a
       WHERE LOWER(TRIM(COALESCE(a.email::text, ''))) = LOWER(TRIM($1::text))
     )`,
    ["admin@gmail.com", hash, "Admin"]
  );
  if (ins.rowCount > 0) {
    console.log("[migrate] ✓ seeded admin: admin@gmail.com / admin123");
  } else {
    console.log("[migrate] ✓ admin already exists, skipped");
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=================================================");
  console.log("  Drone-Hire — Database Migration Runner");
  console.log(`  DB Host : ${process.env.DB_HOST}`);
  console.log(`  DB Port : ${process.env.DB_PORT}`);
  console.log(`  DB Name : ${process.env.DB_NAME}`);
  console.log("=================================================");

  try {
    await migrateAuthSchema();
    await migrateDroneSchema();
    await migrateMissionSchema();
    await migratePhoneOtpSchema();
    await migrateEmailResetSchema();
    await migrateMissionRequestsSchema();
    await migrateServicesSchema();
    await seedAdmin();

    console.log("\n✅  All migrations completed successfully!\n");
  } catch (err) {
    console.error("\n❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
