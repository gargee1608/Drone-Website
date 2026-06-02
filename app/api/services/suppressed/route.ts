import { NextResponse } from "next/server";

import { querySuppressedServiceSlugs } from "@/lib/services-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slugs = await querySuppressedServiceSlugs();
    return NextResponse.json(slugs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
