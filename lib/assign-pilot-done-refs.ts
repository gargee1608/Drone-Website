const KEY = "aerolaminar_assign_pilot_done_refs_v1";

export function loadAssignPilotDoneRefs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveAssignPilotDoneRefs(refs: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(refs));
}

export function appendAssignPilotDoneRef(requestRef: string): void {
  const cur = loadAssignPilotDoneRefs();
  if (cur.includes(requestRef)) return;
  saveAssignPilotDoneRefs([...cur, requestRef]);
}

/** Drop refs that no longer exist in User Request storage. */
export function pruneAssignPilotDoneRefs(validRequestRefs: Set<string>): void {
  const cur = loadAssignPilotDoneRefs();
  const next = cur.filter((r) => validRequestRefs.has(r));
  if (next.length !== cur.length) saveAssignPilotDoneRefs(next);
}
