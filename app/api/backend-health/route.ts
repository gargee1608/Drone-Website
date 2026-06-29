import { NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const upstream = await fetch(`${expressBackendOrigin()}/api/health`, {
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        detail,
        hint: "Start the API: `cd backend && npm run dev` (port 4000), or run `npm run dev` from the project root.",
      },
      { status: 502 }
    );
  }
}
