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
    if (key === "service category") out.serviceCategory = value;
    else if (key === "project type") out.projectType = value;
    else if (key === "expected start") out.expectedStartDate = value;
    else if (key === "duration") out.expectedDuration = value;
    else if (key === "budget (inr)") out.budgetRange = value;
    else if (key === "purpose") out.purposeOfProject = value;
    else if (key === "additional notes") out.additionalNotes = value;
    else if (key.startsWith("reference files"))
      out.referenceFileNames = value
        ? value.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  }
  return out;
}

function resolveDropAndType(
  dropLocation: string,
  pickup: string,
  projectTypeFromBlock: string
): { projectType: string; areaOfCoverage: string } {
  const drop = dropLocation.trim();
  if (!drop) {
    return { projectType: projectTypeFromBlock, areaOfCoverage: "" };
  }
  const sep = drop.indexOf(" — ");
  if (sep > 0) {
    const before = drop.slice(0, sep).trim();
    const after = drop.slice(sep + 3).trim();
    const projectType = projectTypeFromBlock || before;
    if (after === pickup) {
      return { projectType, areaOfCoverage: "" };
    }
    return { projectType, areaOfCoverage: drop };
  }
  return { projectType: projectTypeFromBlock, areaOfCoverage: drop };
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
  const drop = String(input.drop_location ?? "").trim();
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

  const { projectType, areaOfCoverage } = resolveDropAndType(
    drop,
    pickup,
    fromBlock.projectType?.trim() ?? ""
  );

  return {
    contactName: String(input.user_name ?? "").trim(),
    contactEmail: String(input.user_email ?? "").trim(),
    projectTitle: title || titlePart || "Project request",
    projectDescription: description,
    serviceCategory: fromBlock.serviceCategory?.trim() || cargo,
    projectType,
    preferredLocation: pickup,
    expectedStartDate: fromBlock.expectedStartDate?.trim() ?? "",
    expectedDuration: fromBlock.expectedDuration?.trim() ?? "",
    budgetRange: fromBlock.budgetRange?.trim() ?? "",
    areaOfCoverage,
    purposeOfProject: fromBlock.purposeOfProject?.trim() ?? "",
    additionalNotes: fromBlock.additionalNotes?.trim() ?? "",
    referenceFileNames: fromBlock.referenceFileNames ?? [],
  };
}

/** Table/list summary for admin Project Requests rows. */
export function formatPostRequirementDesc(parsed: ParsedPostRequirement): string {
  const parts = [
    parsed.serviceCategory.trim()
      ? `Service: ${parsed.serviceCategory.trim()}`
      : null,
    parsed.preferredLocation.trim()
      ? `Location: ${parsed.preferredLocation.trim()}`
      : null,
    parsed.budgetRange.trim() ? `Budget: ${parsed.budgetRange.trim()}` : null,
    parsed.purposeOfProject.trim()
      ? `Purpose: ${parsed.purposeOfProject.trim()}`
      : null,
  ].filter((p): p is string => p != null);
  return parts.length > 0 ? parts.join(" | ") : "Project requirement";
}

export function parsePostRequirementDesc(desc: string): {
  service: string;
  location: string;
  budget: string;
  purpose: string;
} {
  const service = desc.match(/Service:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  const location = desc.match(/Location:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  const budget = desc.match(/Budget:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  const purpose = desc.match(/Purpose:\s*([^|]+)/i)?.[1]?.trim() ?? "—";
  return { service, location, budget, purpose };
}
