import {
  DEFAULT_SUBMITTED_REQUIREMENT_STATUS,
  isProjectRequirementRequest,
} from "@/lib/project-requests";

export type PostRequirementFormValues = {
  contactName: string;
  contactEmail: string;
  projectTitle: string;
  preferredLocation: string;
  projectDescription: string;
  expectedStartDate: string;
  expectedDuration: string;
  purposeOfProject: string;
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

  const detailLines = [
    values.projectDescription.trim(),
    "",
    "[Project details]",
    `Expected start: ${values.expectedStartDate.trim()}`,
    values.expectedDuration.trim()
      ? `Duration: ${values.expectedDuration.trim()}`
      : null,
    `Purpose: ${values.purposeOfProject.trim()}`,
  ].filter((line): line is string => line != null && line !== "");

  return {
    reason_or_title: [title, ...detailLines].join("\n"),
    pickup_location: location,
    drop_location: location,
    payload_weight: "1",
    cargo_type: values.purposeOfProject.trim(),
    mission_urgency: mapMissionUrgency(values.purposeOfProject.trim()),
    client_request_id: meta.clientRequestId,
    requirement_status: isProjectRequirementRequest(meta.clientRequestId)
      ? DEFAULT_SUBMITTED_REQUIREMENT_STATUS
      : undefined,
    user_id: meta.userId,
    user_name: values.contactName.trim() || meta.userName,
    user_email: values.contactEmail.trim() || meta.userEmail,
  };
}

function mapMissionUrgency(purpose: string): string {
  const p = purpose.toLowerCase();
  if (p.includes("search") || p.includes("rescue")) return "urgent";
  return "standard";
}
