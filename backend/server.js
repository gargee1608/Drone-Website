require("dotenv").config();


const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const transporter = require("./email");
const pool = require("./db");


const app = express();

app.use(cors());
app.use(express.json());


const serviceRoute = require("./routes/serviceRoute");

const pilotRoutes = require("./routes/pilotRoutes");
const droneRoutes = require("./routes/droneRoutes");
const blogRoutes = require("./routes/blogRoutes");
const contactRoutes = require("./routes/contact");
const missionRoutes = require("./routes/missionRoutes");
const missionsRequestRoutes = require("./routes/missionsRequestRoutes");

const requestRoutes = require("./routes/request");
app.use("/api", requestRoutes);
app.use("/api", contactRoutes);


app.use("/api/blogs", blogRoutes);

app.use("/api/pilots", pilotRoutes);
app.use("/api/drones", droneRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/missions-requests", missionsRequestRoutes);

/** Non-production (or AUTH_SIGNIN_DETAIL=true): include DB/API error text on 500 signin responses. */
function signinErrorDetail(err) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AUTH_SIGNIN_DETAIL !== "true"
  ) {
    return undefined;
  }
  if (err == null) return undefined;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Map common DB/JWT failures to a clear `message` (alert-friendly); keep optional `detail` for dev. */
function signinFailureResponse(res, err) {
  console.error(err);
  const detail = signinErrorDetail(err);
  const msg =
    err && typeof err === "object" && typeof err.message === "string"
      ? err.message
      : "";
  const code = err && typeof err === "object" ? err.code : undefined;

  if (msg.includes("JWT_SECRET")) {
    return res.status(500).json({
      message:
        "Server misconfiguration: set JWT_SECRET in backend/.env (required when NODE_ENV is production).",
      ...(detail ? { detail } : {}),
    });
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return res.status(503).json({
      message:
        "Database unreachable. Start PostgreSQL and check PGHOST/PGPORT in backend/.env.",
      ...(detail ? { detail } : {}),
    });
  }
  if (code === "28P01") {
    return res.status(503).json({
      message:
        "Database login failed. Check PGUSER and PGPASSWORD (or DB_USER/DB_PASSWORD) in backend/.env.",
      ...(detail ? { detail } : {}),
    });
  }
  if (code === "3D000") {
    return res.status(503).json({
      message:
        "Database does not exist. Create it or set PGDATABASE/DB_NAME in backend/.env.",
      ...(detail ? { detail } : {}),
    });
  }
  if (code === "42P01") {
    return res.status(503).json({
      message:
        "A required database table is missing. Restart the API after fixing PostgreSQL, or create the expected tables.",
      ...(detail ? { detail } : {}),
    });
  }
  if (code === "42703") {
    return res.status(503).json({
      message:
        "Database schema mismatch (missing column). The `users` or `pilots` table may need updating.",
      ...(detail ? { detail } : {}),
    });
  }

  return res
    .status(500)
    .json({ message: "Server error", ...(detail ? { detail } : {}) });
}

async function ensureAuthSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user'
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      name TEXT
    );
  `);
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
  /** Legacy `pilots` tables created without `email` break sign-in queries; add columns if missing. */
  try {
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS email TEXT"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS password TEXT"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'ACTIVE'"
    );
    await pool.query(
      "UPDATE pilots SET duty_status = 'ACTIVE' WHERE duty_status IS NULL OR TRIM(COALESCE(duty_status, '')) = ''"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS missions_completed INTEGER NOT NULL DEFAULT 0"
    );
    await pool.query(
      "UPDATE pilots SET missions_completed = 0 WHERE missions_completed IS NULL"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS flight_hours INTEGER NOT NULL DEFAULT 0"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS safety_rating NUMERIC(6,2) NOT NULL DEFAULT 99.50"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS experience_rank TEXT"
    );
    await pool.query(
      "ALTER TABLE pilots ADD COLUMN IF NOT EXISTS drone_details JSONB NOT NULL DEFAULT '[]'::jsonb"
    );
    await pool.query(`
      UPDATE pilots
      SET flight_hours = trim(experience::text)::integer
      WHERE experience::text ~ '^[0-9]+$'
        AND trim(experience::text)::integer >= 0
        AND flight_hours = 0
    `);
    await pool.query(`
      UPDATE pilots
      SET flight_hours = CAST(
        LEAST(
          50000,
          GREATEST(0, REPLACE(TRIM(experience::text), ',', '')::numeric)
        ) AS integer
      )
      WHERE flight_hours = 0
        AND trim(COALESCE(experience::text, '')) ~ '^[0-9,]+$'
        AND replace(trim(experience::text), ',', '') ~ '^[0-9]+$'
        AND length(replace(trim(experience::text), ',', '')) > 0
    `);
  } catch (e) {
    console.warn("[auth] pilots column ensure skipped:", e.message);
  }
}

async function ensureDroneSchema() {
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
}

async function ensureMissionSchema() {
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

/** Dev: seed a few fleet drones when the table is empty so Assign UI has rows. */
async function seedDevDronesIfEmpty() {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.DISABLE_DEV_DRONE_SEED === "true") return;
  try {
    const c = await pool.query("SELECT COUNT(*)::int AS n FROM drones");
    if (c.rows[0]?.n > 0) return;
    const p = await pool.query("SELECT id FROM pilots ORDER BY id ASC LIMIT 3");
    const ids = p.rows.map((r) => r.id);
    const pilot0 = ids[0] ?? null;
    const pilot1 = ids[1] ?? pilot0;
    const inserts = [
      [
        pilot0,
        "SkyFreight M-1",
        "4409-TX",
        15,
        118,
        38,
        94,
        "FW 4.1.0",
        "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
        "ready",
        "Long-range logistics",
      ],
      [
        pilot0,
        "Atlas Heavy-Lift",
        "8821-HL",
        50,
        95,
        52,
        45,
        "FW 3.9.2",
        "/drones/atlas-heavy-lift.png",
        "charging",
        "Heavy lift platform",
      ],
      [
        pilot1,
        "AeroScout V2",
        "2214-AS",
        8,
        64,
        28,
        78,
        "FW 4.0.8",
        "https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80",
        "ready",
        "Survey & inspection",
      ],
    ];
    for (const row of inserts) {
      await pool.query(
        `INSERT INTO drones (
          pilot_id, model_name, serial_number, max_payload_kg, max_range_km,
          flight_time_min, battery_percent, firmware, image_url, status, subtitle
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        row
      );
    }
    if (inserts.length > 0) {
      console.log("[drones] Seeded demo drone fleet (dev only).");
    }
  } catch (e) {
    console.warn("[drones] Dev seed skipped:", e.message);
  }
}

/** Dev-only: one row in `admins` so Admin Login works (see login page hint). */
async function seedDevAdminsIfEmpty() {
  if (process.env.DISABLE_DEV_ADMIN_SEED === "true") return;

  try {
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
      console.log("[auth] Seeded admin in `admins`: admin@gmail.com / admin123");
    }
  } catch (e) {
    console.warn("[auth] Admin seed skipped:", signinErrorDetail(e));
  }
}


// ✅ API route
app.use("/api/services", serviceRoute);

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return "dev-insecure-jwt-secret";
}

async function ensureServicesSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price TEXT,
      image TEXT
    );
  `);
}

async function ensurePhoneOtpSchema() {
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
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS phone TEXT"
  );
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS otp_hash TEXT"
  );
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ"
  );
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT FALSE"
  );
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0"
  );
  await pool.query(
    "ALTER TABLE phone_otps ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  );
}

app.post("/api/auth/send-phone-otp", async (req, res) => {
  try {
    await ensurePhoneOtpSchema();
    const phone = normalizePhoneForOtp(req.body?.phone);
    if (!phone) {
      return res.status(400).json({
        message:
          "Enter a valid mobile number (10 digits for India, or international with country code).",
      });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      return res.status(500).json({
        message:
          "SMS provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
      });
    }

    const otp = String(generateOTP());
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.query(
      `UPDATE phone_otps SET used = TRUE WHERE phone = $1 AND used = FALSE`,
      [phone]
    );
    await pool.query(
      `INSERT INTO phone_otps (phone, otp_hash, expires_at, used, attempt_count)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', FALSE, 0)`,
      [phone, otpHash]
    );

    const client = twilio(sid, token);
    await client.messages.create({
      body: `Your OTP is ${otp}. It expires in 5 minutes.`,
      from,
      to: phone,
    });

    return res.json({ ok: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-phone-otp", async (req, res) => {
  try {
    await ensurePhoneOtpSchema();
    const phone = normalizePhoneForOtp(req.body?.phone);
    const otp = String(req.body?.otp ?? "").replace(/\D/g, "");
    if (!phone || otp.length < 4 || otp.length > 6) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const rowRes = await pool.query(
      `SELECT id, otp_hash, attempt_count
       FROM phone_otps
       WHERE phone = $1
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );
    if (rowRes.rows.length === 0) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    const otpRow = rowRes.rows[0];
    const ok = await bcrypt.compare(otp, String(otpRow.otp_hash));
    if (!ok) {
      const attempts = Number(otpRow.attempt_count ?? 0) + 1;
      await pool.query(
        `UPDATE phone_otps
         SET attempt_count = $1,
             used = CASE WHEN $1 >= 5 THEN TRUE ELSE used END
         WHERE id = $2`,
        [attempts, otpRow.id]
      );
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await pool.query(`UPDATE phone_otps SET used = TRUE WHERE id = $1`, [otpRow.id]);

    let user = null;
    try {
      const userRes = await pool.query(
        `SELECT * FROM users
         WHERE regexp_replace(COALESCE(phone::text,''), '\D', '', 'g') = $1
         LIMIT 1`,
        [phoneDigitsOnly(phone)]
      );
      user = userRes.rows[0] ?? null;
    } catch {
      user = null;
    }

    const sub = user
      ? String(jsonSafe(user.id) ?? user.id ?? "")
      : `phone:${phoneDigitsOnly(phone)}`;
    const token = jwt.sign({ sub, role: "user", phone }, jwtSecret(), {
      expiresIn: "7d",
    });

    return res.json({
      ok: true,
      token,
      role: "user",
      user: user ? userPayloadForResponse(user, "user") : { id: sub, role: "user", phone },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

async function ensureEmailPasswordResetSchema() {
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
}

function normalizeEmailForAuth(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

/** Sends a 6-digit OTP to the account email (Mailtrap / SMTP). */
app.post("/api/auth/forgot-password-send-otp", async (req, res) => {
  try {
    await ensureEmailPasswordResetSchema();
    const email = normalizeEmailForAuth(req.body?.email);
    const role = String(req.body?.role ?? "user").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!["user", "pilot", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    let accountRow = null;
    if (role === "pilot") {
      const r = await pool.query(
        `SELECT id, email FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountRow = r.rows[0] ?? null;
    } else if (role === "admin") {
      const r = await pool.query(
        `SELECT id, email FROM admins WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountRow = r.rows[0] ?? null;
    } else {
      const r = await pool.query(
        `SELECT id, email, role FROM users WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountRow = r.rows[0] ?? null;
      if (accountRow) {
        const ur = String(accountRow.role ?? "user").toLowerCase();
        if (ur === "pilot") {
          return res.status(400).json({
            message:
              "This email is registered as a pilot. Open Pilot Login to reset your password.",
          });
        }
        if (ur === "admin") {
          return res.status(400).json({
            message:
              "This is an admin account. Use Admin Login and forgot password there.",
          });
        }
      }
    }

    if (!accountRow) {
      if (role === "user") {
        const pr = await pool.query(
          `SELECT id FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
          [email]
        );
        if (pr.rows.length > 0) {
          return res.status(404).json({
            message:
              "No user account with this email. If you registered as a pilot, open Pilot Login and use Forgot Password there.",
          });
        }
      }
      return res.status(404).json({
        message: "No account found with this email.",
      });
    }

    const otp = String(generateOTP());
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.query(
      `UPDATE email_password_reset_otps SET used = TRUE
       WHERE LOWER(TRIM(email)) = $1 AND account_role = $2 AND used = FALSE`,
      [email, role]
    );
    await pool.query(
      `INSERT INTO email_password_reset_otps (email, account_role, otp_hash, expires_at, used, attempt_count)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', FALSE, 0)`,
      [email, role, otpHash]
    );

    const fromAddr = process.env.MAIL_FROM || "no-reply@test.com";
    await transporter.sendMail({
      from: fromAddr,
      to: email,
      subject: "Password reset OTP",
      text: `Your password reset OTP is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your password reset OTP is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
    });

    return res.json({ ok: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("[auth] forgot-password-send-otp:", err);
    return res
      .status(500)
      .json({ message: "Could not send OTP. Try again later." });
  }
});

app.post("/api/auth/forgot-password-verify-otp", async (req, res) => {
  try {
    await ensureEmailPasswordResetSchema();
    const email = normalizeEmailForAuth(req.body?.email);
    const role = String(req.body?.role ?? "user").toLowerCase();
    const otp = String(req.body?.otp ?? "").replace(/\D/g, "");
    if (!email || !["user", "pilot", "admin"].includes(role)) {
      return res.status(400).json({ message: "Email and account type are required." });
    }
    if (otp.length !== 6) {
      return res.status(400).json({ message: "Enter the 6-digit OTP." });
    }

    const rowRes = await pool.query(
      `SELECT id, otp_hash, attempt_count
       FROM email_password_reset_otps
       WHERE LOWER(TRIM(email)) = $1
         AND account_role = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, role]
    );
    if (rowRes.rows.length === 0) {
      return res.status(400).json({ message: "OTP expired or not found. Request a new code." });
    }

    const otpRow = rowRes.rows[0];
    const ok = await bcrypt.compare(otp, String(otpRow.otp_hash));
    if (!ok) {
      const attempts = Number(otpRow.attempt_count ?? 0) + 1;
      await pool.query(
        `UPDATE email_password_reset_otps
         SET attempt_count = $1,
             used = CASE WHEN $1 >= 5 THEN TRUE ELSE used END
         WHERE id = $2`,
        [attempts, otpRow.id]
      );
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE email_password_reset_otps SET used = TRUE WHERE id = $1`,
      [otpRow.id]
    );

    let accountId = null;
    if (role === "pilot") {
      const r = await pool.query(
        `SELECT id FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountId = r.rows[0]?.id ?? null;
    } else if (role === "admin") {
      const r = await pool.query(
        `SELECT id FROM admins WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountId = r.rows[0]?.id ?? null;
    } else {
      const r = await pool.query(
        `SELECT id FROM users WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
        [email]
      );
      accountId = r.rows[0]?.id ?? null;
    }

    if (accountId == null) {
      return res.status(400).json({ message: "Account not found." });
    }

    const sub = String(jsonSafe(accountId) ?? accountId ?? "");
    const resetToken = jwt.sign(
      { typ: "pwd_reset", email, role, sub },
      jwtSecret(),
      { expiresIn: "15m" }
    );

    return res.json({ ok: true, resetToken });
  } catch (err) {
    console.error("[auth] forgot-password-verify-otp:", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

app.post("/api/auth/forgot-password-complete", async (req, res) => {
  try {
    const resetToken = String(req.body?.resetToken ?? "");
    const newPassword = String(req.body?.newPassword ?? "");
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, jwtSecret());
    } catch {
      return res.status(401).json({ message: "Reset session expired. Start again." });
    }
    if (
      !decoded ||
      typeof decoded !== "object" ||
      decoded.typ !== "pwd_reset" ||
      !decoded.sub ||
      !decoded.role ||
      !decoded.email
    ) {
      return res.status(401).json({ message: "Invalid reset token." });
    }

    const email = normalizeEmailForAuth(decoded.email);
    const role = String(decoded.role).toLowerCase();
    const sub = String(decoded.sub ?? "").trim();
    const hash = await bcrypt.hash(newPassword, 10);

    if (role === "pilot") {
      /** Prefer id + email (tight match); fall back to email-only so `pilots.password` always updates after OTP. */
      let u = { rowCount: 0 };
      if (/^\d+$/.test(sub)) {
        u = await pool.query(
          `UPDATE pilots SET password = $1
           WHERE id = $2::bigint
             AND LOWER(TRIM(COALESCE(email::text, ''))) = $3`,
          [hash, sub, email]
        );
      }
      if (!u.rowCount) {
        u = await pool.query(
          `UPDATE pilots SET password = $1
           WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $2`,
          [hash, email]
        );
      }
      if (u.rowCount === 0) {
        return res.status(400).json({ message: "Could not update password." });
      }
    } else if (role === "admin") {
      let u = { rowCount: 0 };
      if (/^\d+$/.test(sub)) {
        u = await pool.query(
          `UPDATE admins SET password = $1
           WHERE id = $2::bigint
             AND LOWER(TRIM(COALESCE(email::text, ''))) = $3`,
          [hash, sub, email]
        );
      }
      if (!u.rowCount) {
        u = await pool.query(
          `UPDATE admins SET password = $1
           WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $2`,
          [hash, email]
        );
      }
      if (u.rowCount === 0) {
        return res.status(400).json({ message: "Could not update password." });
      }
    } else {
      /** User Login — same pattern as pilot: `users.password` gets bcrypt hash. */
      let u = { rowCount: 0 };
      if (/^\d+$/.test(sub)) {
        u = await pool.query(
          `UPDATE users SET password = $1
           WHERE id = $2::bigint
             AND LOWER(TRIM(COALESCE(email::text, ''))) = $3`,
          [hash, sub, email]
        );
      }
      if (!u.rowCount) {
        u = await pool.query(
          `UPDATE users SET password = $1
           WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $2`,
          [hash, email]
        );
      }
      if (u.rowCount === 0) {
        return res.status(400).json({ message: "Could not update password." });
      }
    }

    return res.json({ ok: true, message: "Password Updated" });
  } catch (err) {
    console.error("[auth] forgot-password-complete:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** Public signup — stores `role = user` with bcrypt password (same verification as sign-in). */
app.post("/api/auth/register", async (req, res) => {
  const firstName = String(req.body?.firstName ?? "").trim();
  const lastName = String(req.body?.lastName ?? "").trim();
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!firstName || !lastName) {
    return res.status(400).json({ message: "First and last name are required." });
  }
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1 LIMIT 1`,
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists. Sign in instead.",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const ins = await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1::text, $2::text, $3::text, 'user')
       RETURNING id, email, name, role`,
      [email, hash, name]
    );
    const row = ins.rows[0];
    return res.status(201).json({
      success: true,
      message: "Account created.",
      user: userPayloadForResponse(row, "user"),
    });
  } catch (err) {
    console.error("[auth] register:", err);
    if (err && err.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists. Sign in instead.",
      });
    }
    return signinFailureResponse(res, err);
  }
});

/** Same path/shape as `server/` auth API — used by Next proxy + pilot login. */
app.post("/api/auth/signin", async (req, res) => {
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");
  const wantedRole = req.body.role === "admin" ? "admin" : req.body.role === "pilot" ? "pilot" : "user";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  /** Pilot dashboard: only rows in `pilots` (with matching password) may sign in. */
  if (wantedRole === "pilot") {
    try {
      const pilotRes = await pool.query(
        "SELECT * FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
        [email]
      );
      if (pilotRes.rows.length === 0) {
        return res.status(401).json({ message: "Pilot not found" });
      }
      const pilot = pilotRes.rows[0];
      const stored = storedPasswordFromUser(pilot);
      const ok = await passwordMatches(password, stored);
      if (!ok) {
        return res.status(401).json({ message: "Pilot not found" });
      }
      const fullName = String(pilot.name ?? "")
        .replace(/\s+/g, " ")
        .trim();
      const token = jwt.sign(
        {
          sub: String(pilot.id),
          role: "pilot",
          name: fullName,
        },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      return res.json({
        ok: true,
        token,
        role: "pilot",
        user: {
          id: jsonSafe(pilot.id) != null ? String(jsonSafe(pilot.id)) : "",
          name: fullName,
          fullName,
          email: pilot.email == null ? "" : String(pilot.email),
          role: "pilot",
        },
      });
    } catch (e) {
      return signinFailureResponse(res, e);
    }
  }

  /** Admin dashboard: credentials live in `admins` only (email + bcrypt password). */
  if (wantedRole === "admin") {
    try {
      const adminRes = await pool.query(
        "SELECT * FROM admins WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
        [email]
      );
      if (adminRes.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const admin = adminRes.rows[0];
      const stored = storedPasswordFromUser(admin);
      const ok = await passwordMatches(password, stored);
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const fullName = String(admin.name ?? "")
        .replace(/\s+/g, " ")
        .trim();
      const displayName = fullName || "Admin";
      const sub = String(jsonSafe(admin.id) ?? admin.id ?? "");
      const token = jwt.sign(
        { sub, role: "admin", name: displayName },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      return res.json({
        ok: true,
        token,
        role: "admin",
        user: {
          id: sub,
          email: admin.email == null ? "" : String(admin.email),
          name: displayName,
          fullName: displayName,
          role: "admin",
        },
      });
    } catch (e) {
      return signinFailureResponse(res, e);
    }
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const stored = storedPasswordFromUser(user);
    const ok = await passwordMatches(password, stored);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = String(user.role || "user").toLowerCase();
    if (wantedRole === "pilot" && role !== "pilot") {
      return res.status(403).json({ message: "Not a pilot account" });
    }
    if (wantedRole === "user" && role === "admin") {
      return res.status(403).json({ message: "Use Admin Login for this account" });
    }
    if (wantedRole === "user" && role === "pilot") {
      return res.status(403).json({ message: "Use Pilot Login for this account" });
    }

    const sub = String(jsonSafe(user.id) ?? user.id ?? "");
    const token = jwt.sign({ sub, role }, jwtSecret(), { expiresIn: "7d" });

    return res.json({
      ok: true,
      token,
      role,
      user: userPayloadForResponse(user, role),
    });
  } catch (err) {
    return signinFailureResponse(res, err);
  }
});

// LOGIN API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// STEP 7
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = generateOTP();

  try {
    await transporter.sendMail({
      from: "no-reply@test.com",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`
    });

    console.log("OTP SENT:", otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Email sending failed" });
  }
});

// Pilot registration: POST /api/pilots/register (with password) — see routes/pilotRoutes.js

ensureAuthSchema()
  .then(() => ensureDroneSchema())
  .then(() => ensureMissionSchema())
  .then(() => ensureServicesSchema())
  .then(() => seedDevAdminsIfEmpty())
  .then(() => seedDevDronesIfEmpty())
  .then(() =>
    missionsRequestRoutes.bootstrapMissionRequests().catch((err) => {
      console.warn("[mission-requests] bootstrap failed:", err);
    })
  )
  .then(() => {
    jwtSecret();
    const PORT = process.env.BACKEND_PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[auth] Database bootstrap failed:", err);
    process.exit(1);
  });