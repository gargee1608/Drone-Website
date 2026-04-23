import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const url = `${expressBackendOrigin()}/api/pilots/register${req.nextUrl.search}`;

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        message: "Backend unreachable",
        detail,
        hint: "Start `cd backend && npm run dev` on port 4000 (PostgreSQL required), or set `BACKEND_URL`.",
      },
      { status: 502 }
    );
  }

  const out = new Headers();
  const uct = upstream.headers.get("content-type");
  if (uct) out.set("content-type", uct);
  const text = await upstream.text();
  return new NextResponse(text, { status: upstream.status, headers: out });
}
