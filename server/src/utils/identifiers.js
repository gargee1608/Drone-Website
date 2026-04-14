const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} raw
 * @returns {{ kind: 'email' | 'phone'; key: string; email?: string; mobile?: string }}
 */
export function parseIdentifier(raw) {
  const s = String(raw || "").trim();
  if (!s) {
    const err = new Error("Identifier is required");
    err.status = 400;
    err.code = "INVALID_IDENTIFIER";
    throw err;
  }
  if (emailPattern.test(s)) {
    const email = s.toLowerCase();
    return { kind: "email", key: email, email };
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) {
    return { kind: "phone", key: `p:${digits}`, mobile: digits };
  }
  const err = new Error("Enter a valid email or 10-digit mobile number");
  err.status = 400;
  err.code = "INVALID_IDENTIFIER";
  throw err;
}

export function userQueryFromParsed(parsed) {
  if (parsed.kind === "email") {
    return { email: parsed.email };
  }
  return { mobile: parsed.mobile };
}
