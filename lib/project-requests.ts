/** Client id prefix for Post Your Requirement (`/post-your-requirement`). */
export const PROJECT_REQUEST_CLIENT_ID_PREFIX = "#PR-";

export const PROJECT_REQUESTS_UPDATED_EVENT =
  "aerolaminar-project-requests-updated";

export function isProjectRequirementRequest(
  clientRequestId: string | null | undefined
): boolean {
  const id = String(clientRequestId ?? "").trim();
  return id.startsWith(PROJECT_REQUEST_CLIENT_ID_PREFIX);
}

/** Splits `reason — Phone: …` written by Post Your Requirement. */
export function parseRequirementReasonWithPhone(reason: string): {
  title: string;
  phone: string | null;
} {
  const raw = reason.trim();
  const sep = " — Phone: ";
  const idx = raw.indexOf(sep);
  if (idx === -1) {
    return { title: raw, phone: null };
  }
  const title = raw.slice(0, idx).trim();
  const phone = raw.slice(idx + sep.length).trim();
  return {
    title: title || raw,
    phone: phone || null,
  };
}

export function notifyProjectRequestsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROJECT_REQUESTS_UPDATED_EVENT));
}
