import bcrypt from "bcryptjs";
import { parseIdentifier } from "../utils/identifiers.js";

const usersById = new Map();
const byEmail = new Map();
const byMobile = new Map();

export function createUser({ email, mobile, passwordHash, role }) {
  const id = crypto.randomUUID();
  const user = {
    id,
    email: email ?? null,
    mobile: mobile ?? null,
    passwordHash: passwordHash ?? null,
    role: role || "user",
  };
  usersById.set(id, user);
  if (user.email) byEmail.set(user.email.toLowerCase(), user);
  if (user.mobile) byMobile.set(String(user.mobile), user);
  return user;
}

export function findUserByParsed(parsed) {
  if (parsed.kind === "email") {
    return byEmail.get(parsed.email) ?? null;
  }
  return byMobile.get(parsed.mobile) ?? null;
}

/** Optional: admin from env (no database). */
export async function initUsersFromEnv() {
  const raw = process.env.ADMIN_EMAIL?.trim();
  const pass = process.env.ADMIN_PASSWORD;
  if (!raw || !pass) return;
  let parsed;
  try {
    parsed = parseIdentifier(raw);
  } catch {
    console.warn("[auth] ADMIN_EMAIL is invalid");
    return;
  }
  if (parsed.kind !== "email") {
    console.warn("[auth] ADMIN_EMAIL must be an email address");
    return;
  }
  if (findUserByParsed(parsed)) return;
  const passwordHash = await bcrypt.hash(pass, 10);
  createUser({
    email: parsed.email,
    mobile: null,
    passwordHash,
    role: "admin",
  });
  console.log(`[auth] In-memory admin: ${parsed.email}`);
}
