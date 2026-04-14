/** In-memory OTPs (cleared on server restart). Key = stable identifier from parseIdentifier. */
const store = new Map();

export function setOtp(identifier, codeHash, expiresAt) {
  store.set(identifier, { codeHash, expiresAt });
}

export function getOtp(identifier) {
  return store.get(identifier) ?? null;
}

export function deleteOtp(identifier) {
  store.delete(identifier);
}
