import {
  DEFAULT_SUBMITTED_REQUIREMENT_STATUS,
  isProjectRequirementRequest,
} from "@/lib/project-requests";

function resolveDropLocation(
  area: string,
  projectType: string,
  location: string
): string {
  const trimmedArea = area.trim();
  if (trimmedArea.length >= 3) return trimmedArea.slice(0, 500);
  const composite = `${projectType.trim()} — ${location.trim()}`.trim();
  if (composite.length >= 3) return composite.slice(0, 500);
  return location.trim().slice(0, 500) || composite || location.trim();
}

export type PostRequirementFormValues = {
  contactName: string;
  contactEmail: string;
  projectTitle: string;
  serviceCategory: string;
  projectType: string;
  preferredLocation: string;
  projectDescription: string;
  expectedStartDate: string;
  expectedDuration: string;
  budgetRange: string;
  areaOfCoverage: string;
  purposeOfProject: string;
  additionalNotes: string;
  referenceFileNames: string[];
};

export function mapPostRequirementToSubmitPayload(
  values: PostRequirementFormValues,
  meta: {
    clientRequestId: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
  }
) {
  const title = values.projectTitle.trim();
  const location = values.preferredLocation.trim();
  const drop = resolveDropLocation(
    values.areaOfCoverage,
    values.projectType,
    location
  );

  const detailLines = [
    values.projectDescription.trim(),
    "",
    "[Project details]",
    `Service category: ${values.serviceCategory.trim()}`,
    `Project type: ${values.projectType.trim()}`,
    `Expected start: ${values.expectedStartDate.trim()}`,
    values.expectedDuration.trim()
      ? `Duration: ${values.expectedDuration.trim()}`
      : null,
    `Budget (INR): ${values.budgetRange.trim()}`,
    `Purpose: ${values.purposeOfProject.trim()}`,
    values.additionalNotes.trim()
      ? `Additional notes: ${values.additionalNotes.trim()}`
      : null,
    values.referenceFileNames.length > 0
      ? `Reference files (names only): ${values.referenceFileNames.join(", ")}`
      : null,
  ].filter((line): line is string => line != null && line !== "");

  return {
    reason_or_title: [title, ...detailLines].join("\n"),
    pickup_location: location,
    drop_location: drop,
    payload_weight: "1",
    cargo_type: values.serviceCategory.trim(),
    mission_urgency: mapMissionUrgency(
      values.purposeOfProject.trim(),
      values.budgetRange.trim()
    ),
    client_request_id: meta.clientRequestId,
    requirement_status: isProjectRequirementRequest(meta.clientRequestId)
      ? DEFAULT_SUBMITTED_REQUIREMENT_STATUS
      : undefined,
    user_id: meta.userId,
    user_name: values.contactName.trim() || meta.userName,
    user_email: values.contactEmail.trim() || meta.userEmail,
  };
}

function mapMissionUrgency(purpose: string, budget: string): string {
  const p = purpose.toLowerCase();
  if (p.includes("search") || p.includes("rescue")) return "urgent";
  const b = budget.toLowerCase();
  if (b.includes("above") || b.includes("2,50,000") || b.includes("5,00,000")) {
    return "express";
  }
  return "standard";
}
