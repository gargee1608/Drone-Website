import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

async function proxyUserRequestById(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  const headers = new Headers();
  for (const name of ["content-type", "accept", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(
      `${expressBackendOrigin()}/api/user-requests/${encodeURIComponent(id)}${request.nextUrl.search}`,
      init
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Backend unreachable",
        detail,
        hint: "Run the API on port 4000 or set BACKEND_URL.",
      },
      { status: 502 }
    );
  }

  const out = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);

  const body = await response.text();
  return new NextResponse(body, { status: response.status, headers: out });
}

export function GET(request: NextRequest, ctx: RouteCtx) {
  return proxyUserRequestById(request, ctx);
}

export function PUT(request: NextRequest, ctx: RouteCtx) {
  return proxyUserRequestById(request, ctx);
}

export function PATCH(request: NextRequest, ctx: RouteCtx) {
  return proxyUserRequestById(request, ctx);
}

export function DELETE(request: NextRequest, ctx: RouteCtx) {
  return proxyUserRequestById(request, ctx);
}
