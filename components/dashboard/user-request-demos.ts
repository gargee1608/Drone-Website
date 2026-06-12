/** Shared demo missions for admin dashboard User Request table and detail modal. */
import {
  ADMIN_URGENCY_BADGE_CRITICAL,
  ADMIN_URGENCY_BADGE_NORMAL,
  ADMIN_URGENCY_BADGE_ROUTINE,
} from "@/lib/admin-dashboard-styles";
export const USER_REQUEST_DEMO_MISSIONS = [
  {
    title: "Medical Emergency",
    badge: "CRITICAL",
    badgeClass: ADMIN_URGENCY_BADGE_CRITICAL,
    barColor: "#ba1a1a",
    desc: "Payload: Medical cargo (0.2kg) | Target: Downtown Medical",
  },
  {
    title: "Medical Emergency Supply",
    badge: "CRITICAL",
    badgeClass: ADMIN_URGENCY_BADGE_CRITICAL,
    barColor: "#ba1a1a",
    desc: "Payload: Insulin Cool-Box (4.2kg) | Target: Sector 7G Rural Clinic",
  },
  {
    title: "Industrial Part Delivery",
    badge: "NORMAL",
    badgeClass: ADMIN_URGENCY_BADGE_NORMAL,
    barColor: "#006195",
    desc: "Payload: Steel Coupling (12kg) | Target: Port of Aerolia",
  },
  {
    title: "Agricultural Mapping",
    badge: "ROUTINE",
    badgeClass: ADMIN_URGENCY_BADGE_ROUTINE,
    barColor: "#008B8B",
    desc: "Payload: Multispectral Camera (1.5kg) | Target: Highland Farms",
  },
] as const;

export type UserRequestDemoMission = (typeof USER_REQUEST_DEMO_MISSIONS)[number];
