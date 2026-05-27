import { NextResponse } from "next/server";

import { suppressServiceSlug } from "@/lib/services-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: unknown;
    };
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }
    await suppressServiceSlug(slug);
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to suppress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
