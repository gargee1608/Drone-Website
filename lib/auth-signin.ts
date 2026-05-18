import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { getPgPool } from "@/lib/pg-pool";

export type SignInRole = "user" | "pilot" | "admin";

export type SignInBody = {
  email?: string;
  password?: string;
  role?: string;
};

export type SignInSuccess = {
  ok: true;
  token: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string;
    fullName: string;
    role: string;
  };
};

export type SignInFailure = {
  status: number;
  body: Record<string, unknown>;
};

function jsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  return value;
}

function storedPasswordFromUser(user: Record<string, unknown> | undefined): string {
  if (!user) return "";
  const p = user.password ?? user.password_hash ?? user.pwd ?? "";
  return String(p ?? "");
}

async function passwordMatches(plaintext: string, stored: string): Promise<boolean> {
  if (!plaintext || !stored) return false;
  try {
    return await bcrypt.compare(String(plaintext), String(stored));
  } catch {
    return false;
  }
}

function userPayloadForResponse(
  user: Record<string, unknown>,
  role: string
): SignInSuccess["user"] {
  return {
    id: jsonSafe(user.id) != null ? String(jsonSafe(user.id)) : "",
    email: user.email == null ? "" : String(user.email),
    name: String(user.name ?? "")
      .replace(/\s+/g, " ")
      .trim(),
    fullName: String(user.name ?? "")
      .replace(/\s+/g, " ")
      .trim(),
    role: role || String(user.role ?? "user"),
  };
}

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return "dev-insecure-jwt-secret";
}

function signinErrorDetail(err: unknown): string | undefined {
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

function signinFailure(err: unknown): SignInFailure {
  console.error("[auth/signin]", err);
  const detail = signinErrorDetail(err);
  const msg =
    err && typeof err === "object" && typeof (err as Error).message === "string"
      ? (err as Error).message
      : "";
  const code =
    err && typeof err === "object" ? (err as { code?: string }).code : undefined;

  if (msg.includes("JWT_SECRET")) {
    return {
      status: 500,
      body: {
        message:
          "Server misconfiguration: set JWT_SECRET in backend/.env (required when NODE_ENV is production).",
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return {
      status: 503,
      body: {
        message:
          "Database unreachable. Start PostgreSQL and check PGHOST/PGPORT in backend/.env.",
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (code === "28P01") {
    return {
      status: 503,
      body: {
        message:
          "Database login failed. Check PGUSER and PGPASSWORD in backend/.env.",
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (code === "3D000") {
    return {
      status: 503,
      body: {
        message:
          "Database does not exist. Create it or set PGDATABASE/DB_NAME in backend/.env.",
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (code === "42P01") {
    return {
      status: 503,
      body: {
        message:
          "A required database table is missing. Restart the API after fixing PostgreSQL.",
        ...(detail ? { detail } : {}),
      },
    };
  }
  if (code === "42703") {
    return {
      status: 503,
      body: {
        message:
          "Database schema mismatch (missing column). The users or pilots table may need updating.",
        ...(detail ? { detail } : {}),
      },
    };
  }

  return {
    status: 500,
    body: { message: "Server error", ...(detail ? { detail } : {}) },
  };
}

/** Same behavior as Express `POST /api/auth/signin` — runs in Next when Express is down. */
export async function handleAuthSignIn(
  input: SignInBody
): Promise<SignInSuccess | SignInFailure> {
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(input.password ?? "");
  const wantedRole: SignInRole =
    input.role === "admin"
      ? "admin"
      : input.role === "pilot"
        ? "pilot"
        : "user";

  if (!email || !password) {
    return {
      status: 400,
      body: { message: "Email and password are required" },
    };
  }

  const pool = getPgPool();

  if (wantedRole === "pilot") {
    try {
      const pilotRes = await pool.query(
        "SELECT * FROM pilots WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
        [email]
      );
      if (pilotRes.rows.length === 0) {
        return {
          status: 401,
          body: { message: "Incorrect email.", signInError: "email" },
        };
      }
      const pilot = pilotRes.rows[0] as Record<string, unknown>;
      const stored = storedPasswordFromUser(pilot);
      const ok = await passwordMatches(password, stored);
      if (!ok) {
        return {
          status: 401,
          body: { message: "Incorrect password.", signInError: "password" },
        };
      }
      const fullName = String(pilot.name ?? "")
        .replace(/\s+/g, " ")
        .trim();
      const token = jwt.sign(
        { sub: String(pilot.id), role: "pilot", name: fullName },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      return {
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
      };
    } catch (e) {
      return signinFailure(e);
    }
  }

  if (wantedRole === "admin") {
    try {
      const adminRes = await pool.query(
        "SELECT * FROM admins WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
        [email]
      );
      if (adminRes.rows.length === 0) {
        return {
          status: 401,
          body: { message: "Incorrect email.", signInError: "email" },
        };
      }
      const admin = adminRes.rows[0] as Record<string, unknown>;
      const stored = storedPasswordFromUser(admin);
      const ok = await passwordMatches(password, stored);
      if (!ok) {
        return {
          status: 401,
          body: { message: "Incorrect password.", signInError: "password" },
        };
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
      return {
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
      };
    } catch (e) {
      return signinFailure(e);
    }
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(COALESCE(email::text, ''))) = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return {
        status: 401,
        body: { message: "Incorrect email.", signInError: "email" },
      };
    }

    const user = result.rows[0] as Record<string, unknown>;
    const stored = storedPasswordFromUser(user);
    const ok = await passwordMatches(password, stored);
    if (!ok) {
      return {
        status: 401,
        body: { message: "Incorrect password.", signInError: "password" },
      };
    }

    const role = String(user.role || "user").toLowerCase();
    if (wantedRole === "pilot" && role !== "pilot") {
      return { status: 403, body: { message: "Not a pilot account" } };
    }
    if (wantedRole === "user" && role === "admin") {
      return {
        status: 403,
        body: { message: "Use Admin Login for this account" },
      };
    }
    if (wantedRole === "user" && role === "pilot") {
      return {
        status: 403,
        body: { message: "Use Pilot Login for this account" },
      };
    }

    const sub = String(jsonSafe(user.id) ?? user.id ?? "");
    const token = jwt.sign({ sub, role }, jwtSecret(), { expiresIn: "7d" });

    return {
      ok: true,
      token,
      role,
      user: userPayloadForResponse(user, role),
    };
  } catch (err) {
    return signinFailure(err);
  }
}
