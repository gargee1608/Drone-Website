import jwt from "jsonwebtoken";

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set");
  }
  console.warn(
    "[auth] JWT_SECRET missing; using a dev-only default. Set JWT_SECRET in server/.env."
  );
  return "dev-insecure-jwt-secret-do-not-use-in-production";
}

export function signToken(user) {
  const secret = jwtSecret();
  const id = String(user.id);
  return jwt.sign(
    {
      sub: id,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }
  );
}

export function userPublic(user) {
  return {
    id: String(user.id),
    email: user.email ?? null,
    mobile: user.mobile ?? null,
    role: user.role,
  };
}
