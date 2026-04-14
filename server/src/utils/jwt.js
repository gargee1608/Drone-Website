import jwt from "jsonwebtoken";

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
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
