require("dotenv").config();


const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("./email");
const pool = require("./db");


const app = express();

app.use(cors());
app.use(express.json());


const serviceRoute = require("./routes/serviceRoute");

const pilotRoutes = require("./routes/pilotRoutes");
const blogRoutes = require("./routes/blogRoutes");

app.use("/api/blogs", blogRoutes);

app.use("/api/pilots", pilotRoutes);



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
  } catch (e) {
    console.warn("[auth] pilots column ensure skipped:", e.message);
  }
}

/** Dev-only: one admin so Admin Login works out of the box (see login page hint). */
async function seedDevAdminIfEmpty() {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.DISABLE_DEV_ADMIN_SEED === "true") return;

  try {
    const hash = await bcrypt.hash("test123", 10);
    const ins = await pool.query(
      `INSERT INTO users (email, password, name, role)
       SELECT $1::text, $2::text, $3::text, $4::text
       WHERE NOT EXISTS (
         SELECT 1 FROM users u
         WHERE LOWER(TRIM(COALESCE(u.email::text, ''))) = LOWER(TRIM($1::text))
       )`,
      ["test@gmail.com", hash, "Test Admin", "admin"]
    );
    if (ins.rowCount > 0) {
      console.log("[auth] Seeded dev admin: test@gmail.com / test123");
    }
  } catch (e) {
    console.warn("[auth] Dev admin seed skipped:", signinErrorDetail(e));
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


function storedPasswordFromUser(row) {
  if (!row || typeof row !== "object") return "";
  const r = row;
  const v = r.password ?? r.password_hash ?? r.pass ?? "";
  return v === "" ? "" : String(v);
}

async function passwordMatches(plain, stored) {
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

/** Express `res.json` cannot serialize `bigint` (common for PG `id` columns). */
function jsonSafe(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "object" && value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function userPayloadForResponse(user, role) {
  const userName =
    user.name != null && String(user.name).trim() !== ""
      ? String(user.name).trim()
      : "";
  const payload = {
    id: jsonSafe(user.id) != null ? String(jsonSafe(user.id)) : "",
    email: user.email == null ? "" : String(user.email),
    name: userName,
    role: String(role),
  };
  if (userName) payload.fullName = userName;
  return payload;
}

// STEP 6: OTP generator
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

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
    if (wantedRole === "admin" && role !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
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
  .then(() => seedDevAdminIfEmpty())
  .then(() => {
    jwtSecret();
    app.listen(4000, () => {
      console.log("Server running on port 4000");
    });
  })
  .catch((err) => {
    console.error("[auth] Database bootstrap failed:", err);
    process.exit(1);
  });