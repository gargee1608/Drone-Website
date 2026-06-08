import { serviceCatalogItems } from "@/lib/service-catalog";

export const POST_REQUIREMENT_SERVICE_OPTIONS = [
  ...serviceCatalogItems.map((item) =>
    item.title === "Medical Logistics" ? "Logistics" : item.title
  ),
  "Agricultural Services",
  "Aerial Photography & Videography",
  "Mapping & Surveying",
  "Other",
] as const;

export const POST_REQUIREMENT_PROJECT_TYPE_OPTIONS = [
  "One-time Project",
  "Short-term Contract",
  "Long-term Contract",
  "Recurring / Ongoing",
] as const;

export const POST_REQUIREMENT_DURATION_OPTIONS = [
  "Less than 1 day",
  "1–3 days",
  "1 week",
  "2–4 weeks",
  "1–3 months",
  "More than 3 months",
] as const;

export const POST_REQUIREMENT_BUDGET_OPTIONS = [
  "Under ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000 – ₹2,50,000",
  "₹2,50,000 – ₹5,00,000",
  "Above ₹5,00,000",
] as const;

export const POST_REQUIREMENT_PURPOSE_OPTIONS = [
  "Survey / Mapping",
  "Inspection",
  "Monitoring / Surveillance",
  "Photography / Videography",
  "Agriculture",
  "Construction",
  "Search & Rescue",
  "Other",
] as const;

export const POST_REQUIREMENT_ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const POST_REQUIREMENT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const POST_REQUIREMENT_DESCRIPTION_MAX = 1000;
export const POST_REQUIREMENT_NOTES_MAX = 500;
