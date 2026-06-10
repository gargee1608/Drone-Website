import { apiUrl } from "@/lib/api-url";
import { notifyMissionsDbUpdated } from "@/lib/user-requests";

export const PILOT_MISSION_COMMENTS_KEY = "aerolaminar_pilot_mission_comments_v1";
export const PILOT_MISSION_COMMENT_SAVED_EVENT =
  "aerolaminar-pilot-mission-comment-saved";

export type PilotMissionCommentEntry = {
  text: string;
  createdAt: string;
};

export type PilotMissionCommentSaveTarget = {
  requestRef: string;
  id?: string;
  rowCtid?: string;
  pilotSub?: string;
};

function parseStoredCommentEntry(value: unknown): PilotMissionCommentEntry | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const text = typeof rec.text === "string" ? rec.text.trim() : "";
  if (!text) return null;
  const createdAt =
    typeof rec.createdAt === "string" && rec.createdAt.trim()
      ? rec.createdAt.trim()
      : new Date().toISOString();
  return { text, createdAt };
}

function parseStoredComments(row: unknown): PilotMissionCommentEntry[] {
  if (!row) return [];
  if (typeof row === "string") {
    const text = row.trim();
    return text ? [{ text, createdAt: new Date().toISOString() }] : [];
  }
  if (typeof row !== "object") return [];

  const rec = row as Record<string, unknown>;
  if (Array.isArray(rec.comments)) {
    return rec.comments
      .map(parseStoredCommentEntry)
      .filter((entry): entry is PilotMissionCommentEntry => entry != null);
  }
  if ("text" in rec && typeof rec.text === "string") {
    const text = rec.text.trim();
    if (!text) return [];
    const createdAt =
      typeof rec.updatedAt === "string" && rec.updatedAt.trim()
        ? rec.updatedAt.trim()
        : new Date().toISOString();
    return [{ text, createdAt }];
  }
  return [];
}

export function combinePilotMissionCommentTexts(
  comments: PilotMissionCommentEntry[]
): string {
  return comments
    .map((entry) => entry.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function writePilotMissionComments(
  requestRef: string,
  comments: PilotMissionCommentEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    const key = requestRef.trim();
    const raw = localStorage.getItem(PILOT_MISSION_COMMENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const next =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...(parsed as Record<string, unknown>) }
        : {};
    if (comments.length === 0) {
      delete next[key];
    } else {
      next[key] = {
        comments,
        updatedAt: comments[comments.length - 1]?.createdAt ?? new Date().toISOString(),
      };
    }
    localStorage.setItem(PILOT_MISSION_COMMENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadPilotMissionComments(
  requestRef: string
): PilotMissionCommentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PILOT_MISSION_COMMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    const row = (parsed as Record<string, unknown>)[requestRef.trim()];
    return parseStoredComments(row);
  } catch {
    return [];
  }
}

export function loadPilotMissionCommentText(requestRef: string): string {
  return combinePilotMissionCommentTexts(loadPilotMissionComments(requestRef));
}

export function savePilotMissionCommentText(requestRef: string, text: string): void {
  const trimmed = text.trim();
  writePilotMissionComments(
    requestRef,
    trimmed ? [{ text: trimmed, createdAt: new Date().toISOString() }] : []
  );
}

export function appendPilotMissionCommentText(
  requestRef: string,
  text: string
): PilotMissionCommentEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return loadPilotMissionComments(requestRef);
  const next = [
    ...loadPilotMissionComments(requestRef),
    { text: trimmed, createdAt: new Date().toISOString() },
  ];
  writePilotMissionComments(requestRef, next);
  return next;
}

export function removePilotMissionCommentText(
  requestRef: string,
  createdAt: string
): PilotMissionCommentEntry[] {
  const comments = loadPilotMissionComments(requestRef).filter(
    (entry) => entry.createdAt !== createdAt
  );
  writePilotMissionComments(requestRef, comments);
  return comments;
}

export function notifyPilotMissionCommentSaved(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(PILOT_MISSION_COMMENT_SAVED_EVENT));
  } catch {
    /* ignore */
  }
}

/** Lookup pilot_comment by normalized request_ref (last mission row wins per ref). */
export function buildPilotCommentLookupFromMissions(
  missions: Array<{ request_ref?: string; pilot_comment?: string }>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const mission of missions) {
    const ref = String(mission.request_ref ?? "").trim().toLowerCase();
    const comment = String(mission.pilot_comment ?? "").trim();
    if (ref && comment) map.set(ref, comment);
  }
  return map;
}

export function resolvePilotCommentForRequestRefs(
  refs: string[],
  lookup: Map<string, string>
): string {
  for (const ref of refs) {
    const comment = lookup.get(ref.trim().toLowerCase());
    if (comment) return comment;
  }
  return "";
}

async function syncPilotMissionCommentToBackend(
  target: PilotMissionCommentSaveTarget,
  pilotComment: string
): Promise<boolean> {
  const requestRef = target.requestRef.trim();
  if (!requestRef) return false;

  try {
    const response = await fetch(apiUrl("/api/missions/comment"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: target.id?.trim() || undefined,
        rowCtid: target.rowCtid?.trim() || undefined,
        requestRef,
        pilotSub: target.pilotSub?.trim() || undefined,
        pilotComment: pilotComment.trim(),
      }),
    });
    if (!response.ok) return false;
    notifyPilotMissionCommentSaved();
    notifyMissionsDbUpdated();
    return true;
  } catch {
    return false;
  }
}

/** Replace all comments for a mission with a single comment (edit flows). */
export async function savePilotMissionComment(
  target: PilotMissionCommentSaveTarget,
  text: string
): Promise<boolean> {
  const requestRef = target.requestRef.trim();
  if (!requestRef) return false;

  savePilotMissionCommentText(requestRef, text);
  return syncPilotMissionCommentToBackend(target, text.trim());
}

/** Append a new comment without removing previous ones. */
export async function appendPilotMissionComment(
  target: PilotMissionCommentSaveTarget,
  text: string
): Promise<boolean> {
  const requestRef = target.requestRef.trim();
  const trimmed = text.trim();
  if (!requestRef || !trimmed) return false;

  const comments = appendPilotMissionCommentText(requestRef, trimmed);
  return syncPilotMissionCommentToBackend(
    target,
    combinePilotMissionCommentTexts(comments)
  );
}

/** Remove a single comment by its createdAt timestamp. */
export async function deletePilotMissionComment(
  target: PilotMissionCommentSaveTarget,
  createdAt: string
): Promise<boolean> {
  const requestRef = target.requestRef.trim();
  const at = createdAt.trim();
  if (!requestRef || !at) return false;

  const comments = removePilotMissionCommentText(requestRef, at);
  return syncPilotMissionCommentToBackend(
    target,
    combinePilotMissionCommentTexts(comments)
  );
}
