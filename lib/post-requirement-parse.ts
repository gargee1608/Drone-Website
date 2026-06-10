import { parseRequirementReasonWithPhone } from "@/lib/project-requests";

import type { PostRequirementFormValues } from "@/lib/post-requirement-submit";

export type ParsedPostRequirement = PostRequirementFormValues;

function parseDetailsBlock(lines: string[]): Partial<ParsedPostRequirement> {
  const out: Partial<ParsedPostRequirement> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (key === "expected start") out.expectedStartDate = value;
    else if (key === "duration") out.expectedDuration = value;
    else if (key === "purpose") out.purposeOfProject = value;
  }
  return out;
}

/** Parses stored `drone_hire_requests` fields from Post Your Requirement submissions. */
export function parsePostRequirementBackend(input: {
  reason_or_title?: string;
  pickup_location?: string;
  drop_location?: string;
  cargo_type?: string;
  user_name?: string | null;
  user_email?: string | null;
}): ParsedPostRequirement {
  const reasonRaw = String(input.reason_or_title ?? "").trim();
  const pickup = String(input.pickup_location ?? "").trim();
  const cargo = String(input.cargo_type ?? "").trim();

  const lines = reasonRaw.split("\n");
  const detailsIndex = lines.findIndex(
    (l) => l.trim().toLowerCase() === "[project details]"
  );

  let titlePart = reasonRaw;
  let description = "";

  if (detailsIndex >= 0) {
    titlePart = lines[0]?.trim() ?? "";
    description = lines
      .slice(1, detailsIndex)
      .join("\n")
      .trim();
  } else if (lines.length > 1) {
    titlePart = lines[0]?.trim() ?? "";
    description = lines.slice(1).join("\n").trim();
  }

  const { title } = parseRequirementReasonWithPhone(titlePart);
  const fromBlock =
    detailsIndex >= 0
      ? parseDetailsBlock(lines.slice(detailsIndex + 1))
      : {};

  return {
    contactName: String(input.user_name ?? "").trim(),
    contactEmail: String(input.user_email ?? "").trim(),
    projectTitle: title || titlePart || "Project request",
    projectDescription: description,
    preferredLocation: pickup,
    expectedStartDate: fromBlock.expectedStartDate?.trim() ?? "",
    expectedDuration: fromBlock.expectedDuration?.trim() ?? "",
    purposeOfProject: fromBlock.purposeOfProject?.trim() || cargo,
  };
}

/** Table/list summary for admin Project Requests rows. */
export function formatPostRequirementDesc(parsed: ParsedPostRequirement): string {
  const parts = [
    parsed.preferredLocation.trim()
      ? `Location: ${parsed.preferredLocation.trim()}`
      : null,
    parsed.expectedDuration.trim()
      ? `Duration: ${parsed.expectedDuration.trim()}`
      : null,
    parsed.purposeOfProject.trim()
      ? `Purpose: ${parsed.purposeOfProject.trim()}`
      : null,
  ].filter((p): p is string => p != null);
  return parts.length > 0 ? parts.join(" | ") : "Project requirement";
}

export function parsePostRequirementDesc(desc: string): {
  purpose: string;
  location: string;
  duration: string;
} {
  const purpose = desc.match(/Purpose:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  const location = desc.match(/Location:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  const duration = desc.match(/Duration:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  return { purpose, location, duration };
}
