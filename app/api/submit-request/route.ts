import { NextRequest, NextResponse } from "next/server";

import { insertDroneHireRequest } from "@/lib/drone-hire-requests-db";
import { expressBackendOrigin } from "@/lib/express-backend-origin";
import {
  DEFAULT_SUBMITTED_REQUIREMENT_STATUS,
  isProjectRequirementRequest,
  normalizeRequirementStatus,
} from "@/lib/project-requests";

export const dynamic = "force-dynamic";

type SubmitBody = {
  reason_or_title?: string;
  pickup_location?: string;
  drop_location?: string;
  payload_weight?: string;
  cargo_type?: string;
  mission_urgency?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  client_request_id?: string;
  requirement_status?: string;
};

function parseSubmitBody(body: SubmitBody) {
  const reason_or_title = String(body.reason_or_title ?? "").trim();
  const pickup_location = String(body.pickup_location ?? "").trim();
  let drop_location = String(body.drop_location ?? "").trim();
  const payload_weight = String(body.payload_weight ?? "").trim() || "0";
  const cargo_type = String(body.cargo_type ?? "").trim();
  const mission_urgency = String(body.mission_urgency ?? "").trim();

  if (!reason_or_title) {
    return { error: "Reason or title is required." as const };
  }
  const clientRequestId = String(body.client_request_id ?? "").trim() || null;
  const isProjectReq = isProjectRequirementRequest(clientRequestId);

  if (!pickup_location || pickup_location.length < 3) {
    return { error: "Preferred location is required (at least 3 characters)." as const };
  }
  if (!drop_location || drop_location.length < 3) {
    if (isProjectReq && pickup_location.length >= 3) {
      drop_location = pickup_location;
    } else {
      return { error: "Project location details are required." as const };
    }
  }
  if (!cargo_type) {
    return { error: "Request type is required." as const };
  }
  if (!mission_urgency) {
    return { error: "Priority is required." as const };
  }

  const requirementStatusRaw = String(body.requirement_status ?? "").trim();
  let requirementStatus = requirementStatusRaw
    ? normalizeRequirementStatus(requirementStatusRaw)
    : null;
  if (isProjectRequirementRequest(clientRequestId)) {
    requirementStatus =
      requirementStatus ?? DEFAULT_SUBMITTED_REQUIREMENT_STATUS;
  } else if (requirementStatusRaw && !requirementStatus) {
    return { error: "Invalid requirement status." as const };
  }

  const weight = Number(payload_weight);
  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: "Payload weight must be greater than 0 kg." as const };
  }

  return {
    data: {
      reason_or_title,
      pickup_location,
      drop_location,
      payload_weight,
      cargo_type,
      mission_urgency,
      user_id: String(body.user_id ?? "").trim() || null,
      user_name: String(body.user_name ?? "").trim() || null,
      user_email: String(body.user_email ?? "").trim().toLowerCase() || null,
      client_request_id: clientRequestId,
      requirement_status: requirementStatus,
    },
  };
}

async function proxyToExpress(body: SubmitBody) {
  const upstream = await fetch(`${expressBackendOrigin()}/api/submit-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await upstream.text();
  let json: unknown = null;
  if (text.trim()) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { error: text.slice(0, 240) };
    }
  }
  return NextResponse.json(json ?? {}, { status: upstream.status });
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSubmitBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const row = await insertDroneHireRequest(parsed.data);
    return NextResponse.json({
      message: "Request saved successfully",
      data: row,
    });
  } catch (err) {
    console.error("[api/submit-request] insert failed, trying Express:", err);
    try {
      return await proxyToExpress(body);
    } catch (proxyErr) {
      console.error("[api/submit-request] Express proxy failed:", proxyErr);
      return NextResponse.json(
        {
          error: "Could not save request. Check that PostgreSQL is running.",
        },
        { status: 500 }
      );
    }
  }
}
