import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

async function proxyMissionsRequests(request: NextRequest) {
  const response = await fetch(
    `${expressBackendOrigin()}/api/missions-requests${request.nextUrl.search}`,
    {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    }
  );

  const contentType = response.headers.get("content-type");
  const body = await response.text();

  if (contentType?.includes("application/json")) {
    return NextResponse.json(body ? JSON.parse(body) : {}, {
      status: response.status,
    });
  }

  return new NextResponse(body, { status: response.status });
}

export async function GET(request: NextRequest) {
  try {
    return await proxyMissionsRequests(request);
  } catch (error) {
    console.error("Error in missions-requests GET route:", error);
    return NextResponse.json(
      { error: "Failed to fetch mission requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxyMissionsRequests(request);
  } catch (error) {
    console.error("Error in missions-requests POST route:", error);
    return NextResponse.json(
      { error: "Failed to create mission request" },
      { status: 500 }
    );
  }
}
