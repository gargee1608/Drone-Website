import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ slug: string[] }> };

async function proxy(req: NextRequest, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  if (!slug?.length) {
    return NextResponse.json({ error: "Missing path after /api/express/" }, {
      status: 400,
    });
  }

  const path = slug.join("/");
  const url = `${expressBackendOrigin()}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of ["content-type", "accept", "authorization"]) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }

  const method = req.method.toUpperCase();
  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "Backend unreachable",
        detail,
        hint: "Run the API on port 4000: `cd backend && npm run dev` (PostgreSQL required), or set `BACKEND_URL`.",
      },
      { status: 502 }
    );
  }

  const out = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) out.set("content-type", ct);

  const body = await upstream.text();
  return new NextResponse(body, { status: upstream.status, headers: out });
}

export function GET(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}

export function POST(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}

export function PUT(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}

export function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}

export function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
