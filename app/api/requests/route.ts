import { NextResponse } from "next/server";

import { listDroneHireRequests } from "@/lib/drone-hire-requests-db";
import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

async function proxyListFromExpress() {
  const upstream = await fetch(`${expressBackendOrigin()}/api/requests`, {
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

export async function GET() {
  try {
    const data = await listDroneHireRequests();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[api/requests] list failed, trying Express:", err);
    try {
      return await proxyListFromExpress();
    } catch (proxyErr) {
      console.error("[api/requests] Express proxy failed:", proxyErr);
      return NextResponse.json(
        { error: "Could not load requests. Check that PostgreSQL is running." },
        { status: 500 }
      );
    }
  }
}
