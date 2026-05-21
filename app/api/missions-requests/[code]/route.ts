import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ code: string }> };

async function proxyMissionsRequestByCode(
  request: NextRequest,
  code: string
) {
  const encoded = encodeURIComponent(code);
  const response = await fetch(
    `${expressBackendOrigin()}/api/missions-requests/${encoded}${request.nextUrl.search}`,
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

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  try {
    const { code } = await ctx.params;
    return await proxyMissionsRequestByCode(request, code);
  } catch (error) {
    console.error("Error in missions-requests PUT route:", error);
    return NextResponse.json(
      { error: "Failed to update mission request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const { code } = await ctx.params;
    return await proxyMissionsRequestByCode(request, code);
  } catch (error) {
    console.error("Error in missions-requests DELETE route:", error);
    return NextResponse.json(
      { error: "Failed to delete mission request" },
      { status: 500 }
    );
  }
}
