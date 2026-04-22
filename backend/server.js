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
    return bcrypt.compare(plain, s);
  }
  return plain === s;
}

/** In non-production: any email+password works for pilot login. Set `DEV_PILOT_ANY_LOGIN=false` to disable. */
function isDevPilotAnyLoginEnabled() {
  if (process.env.NODE_ENV === "production") {
    return process.env.DEV_PILOT_ANY_LOGIN === "true";
  }
  return process.env.DEV_PILOT_ANY_LOGIN !== "false";
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

  if (wantedRole === "pilot" && isDevPilotAnyLoginEnabled()) {
    try {
      const token = jwt.sign(
        { sub: `dev-pilot:${email}`, role: "pilot" },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      return res.json({
        ok: true,
        token,
        role: "pilot",
        user: {
          id: "dev-pilot",
          email,
          role: "pilot",
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email::text)) = $1",
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

    const token = jwt.sign(
      { sub: String(user.id), role },
      jwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      role,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
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

// STEP 6
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

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

const PORT = Number(process.env.PORT) || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `[backend] Port ${PORT} is already in use. Stop the existing process or change PORT in backend/.env`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});