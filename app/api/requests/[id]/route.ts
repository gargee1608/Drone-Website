import { NextRequest, NextResponse } from "next/server";

import {
  deleteDroneHireRequest,
  updateDroneHireRequest,
} from "@/lib/drone-hire-requests-db";
import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

async function proxyToExpress(
  id: string,
  method: "PUT" | "DELETE",
  bodyText?: string
) {
  const url = `${expressBackendOrigin()}/api/requests/${encodeURIComponent(id)}`;
  const headers = new Headers();
  if (method === "PUT") {
    headers.set("content-type", "application/json");
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body: method === "PUT" ? bodyText : undefined,
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

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  let bodyText: string;
  try {
    bodyText = await req.text();
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const row = await updateDroneHireRequest(id, {
      reason_or_title: String(body.reason_or_title ?? "").trim() || undefined,
      pickup_location: String(body.pickup_location ?? "").trim() || undefined,
      drop_location: String(body.drop_location ?? "").trim() || undefined,
      payload_weight: String(body.payload_weight ?? "").trim() || undefined,
      cargo_type: String(body.cargo_type ?? "").trim() || undefined,
      mission_urgency: String(body.mission_urgency ?? "").trim() || undefined,
      admin_status: String(body.admin_status ?? "").trim() || undefined,
      requirement_status:
        body.requirement_status != null
          ? String(body.requirement_status).trim()
          : undefined,
      user_name:
        body.user_name != null ? String(body.user_name).trim() : undefined,
      user_email:
        body.user_email != null ? String(body.user_email).trim() : undefined,
    });
    if (!row) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Request updated", data: row });
  } catch (err) {
    console.error("[api/requests] update failed, trying Express:", err);
    try {
      return await proxyToExpress(id, "PUT", bodyText);
    } catch (proxyErr) {
      console.error("[api/requests] Express proxy failed:", proxyErr);
      return NextResponse.json({ error: "Could not update request." }, { status: 500 });
    }
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  try {
    const deleted = await deleteDroneHireRequest(id);
    if (!deleted) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Request deleted", data: { id } });
  } catch (err) {
    console.error("[api/requests] delete failed, trying Express:", err);
    try {
      return await proxyToExpress(id, "DELETE");
    } catch (proxyErr) {
      console.error("[api/requests] Express proxy failed:", proxyErr);
      return NextResponse.json({ error: "Could not delete request." }, { status: 500 });
    }
  }
}
