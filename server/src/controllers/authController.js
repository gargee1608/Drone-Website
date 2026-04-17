import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { createUser, findUserByParsed } from "../stores/userStore.js";
import {
  deleteOtp,
  getOtp,
  setOtp,
} from "../stores/otpStore.js";
import { createMailTransport } from "../config/mailer.js";
import { parseIdentifier } from "../utils/identifiers.js";
import { signToken, userPublic } from "../utils/jwt.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

/** Any password accepts login (creates user if missing). Off in production unless explicitly enabled. */
function isDevLoginAnyPassword() {
  if (process.env.DEV_LOGIN_ANY_PASSWORD === "true") return true;
  if (process.env.DEV_LOGIN_ANY_PASSWORD === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error(errors.array()[0].msg);
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }
}

export async function sendOtp(req, res, next) {
  try {
    assertValid(req);
    const { identifier } = req.body;
    const parsed = parseIdentifier(identifier);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    setOtp(parsed.key, codeHash, expiresAt);

    const transport = createMailTransport();
    const to = process.env.MAIL_TO_INBOX || "test@mailtrap.io";
    const from = process.env.MAIL_FROM || "noreply@aerolaminar.local";

    if (transport) {
      const label =
        parsed.kind === "email" ? parsed.email : `mobile +${parsed.mobile}`;
      try {
        await transport.sendMail({
          from,
          to,
          subject: "Your AEROLAMINAR login code",
          text: `Your one-time code is: ${code}\n\nRequested for: ${label}\nThis code expires in 5 minutes.`,
          html: `<p>Your one-time code is: <strong>${code}</strong></p><p>Requested for: ${label}</p><p>This code expires in 5 minutes.</p>`,
        });
      } catch (mailErr) {
        console.error("[send-otp] Mailtrap send failed:", mailErr);
        deleteOtp(parsed.key);
        const err = new Error(
          "Could not send email. Check MAILTRAP_USER and MAILTRAP_PASS in server/.env."
        );
        err.status = 503;
        err.code = "MAIL_FAILED";
        throw err;
      }
    } else {
      console.log(`[dev OTP] ${parsed.key}: ${code} (Mailtrap not configured)`);
    }

    res.json({
      ok: true,
      message: "OTP sent. Check your Mailtrap inbox (and email if applicable).",
    });
  } catch (e) {
    next(e);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    assertValid(req);
    const { identifier, otp } = req.body;
    const parsed = parseIdentifier(identifier);
    const digits = String(otp || "").replace(/\D/g, "");
    if (digits.length !== 6) {
      const err = new Error("OTP must be 6 digits");
      err.status = 400;
      err.code = "INVALID_OTP";
      throw err;
    }

    const record = getOtp(parsed.key);
    if (!record) {
      const err = new Error("No OTP found. Send a new code.");
      err.status = 400;
      err.code = "OTP_NOT_FOUND";
      throw err;
    }
    if (record.expiresAt.getTime() < Date.now()) {
      deleteOtp(parsed.key);
      const err = new Error("OTP expired. Request a new code.");
      err.status = 400;
      err.code = "OTP_EXPIRED";
      throw err;
    }

    const match = await bcrypt.compare(digits, record.codeHash);
    if (!match) {
      const err = new Error("Invalid OTP");
      err.status = 401;
      err.code = "INVALID_OTP";
      throw err;
    }

    deleteOtp(parsed.key);

    let user = findUserByParsed(parsed);
    if (!user) {
      user = createUser({
        email: parsed.email,
        mobile: parsed.mobile,
        passwordHash: null,
        role: "user",
      });
    } else if (user.role !== "user") {
      const err = new Error("Use password login for this account.");
      err.status = 403;
      err.code = "WRONG_METHOD";
      throw err;
    }

    const token = signToken(user);
    res.json({
      ok: true,
      token,
      user: userPublic(user),
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    assertValid(req);
    const { identifier, password, role: bodyRole } = req.body;
    const wantedRole = bodyRole || "user";
    const parsed = parseIdentifier(identifier);
    const devAnyPassword = isDevLoginAnyPassword();

    let user = findUserByParsed(parsed);

    if (devAnyPassword) {
      if (!user) {
        user = createUser({
          email: parsed.email,
          mobile: parsed.mobile,
          passwordHash: await bcrypt.hash("dev-bypass", BCRYPT_ROUNDS),
          role: wantedRole === "admin" ? "admin" : "user",
        });
        console.warn(
          `[auth] DEV_LOGIN_ANY_PASSWORD: created user ${parsed.key} as ${user.role}`
        );
      }
    } else {
      if (!user || !user.passwordHash) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        err.code = "INVALID_CREDENTIALS";
        throw err;
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        err.code = "INVALID_CREDENTIALS";
        throw err;
      }
    }

    if (!devAnyPassword) {
      if (wantedRole === "admin" && user.role !== "admin") {
        const err = new Error("Not an admin account");
        err.status = 403;
        err.code = "FORBIDDEN";
        throw err;
      }
      if (wantedRole === "user" && user.role === "admin") {
        const err = new Error("Use Admin Login for this account");
        err.status = 403;
        err.code = "FORBIDDEN";
        throw err;
      }
    }

    const token = signToken(user);
    res.json({
      ok: true,
      token,
      user: userPublic(user),
    });
  } catch (e) {
    next(e);
  }
}

export async function register(req, res, next) {
  try {
    assertValid(req);
    const { identifier, password, role } = req.body;
    const parsed = parseIdentifier(identifier);
    const wantedRole = role === "admin" ? "admin" : "user";

    const exists = findUserByParsed(parsed);
    if (exists) {
      const err = new Error("An account with this email or phone already exists");
      err.status = 409;
      err.code = "DUPLICATE";
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = createUser({
      email: parsed.email,
      mobile: parsed.mobile,
      passwordHash,
      role: wantedRole,
    });

    const token = signToken(user);
    res.status(201).json({
      ok: true,
      token,
      user: userPublic(user),
    });
  } catch (e) {
    next(e);
  }
}
