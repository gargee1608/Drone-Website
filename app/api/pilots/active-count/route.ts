import { NextResponse } from "next/server";

import { queryActivePilotsCount } from "@/lib/pilots-table-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await queryActivePilotsCount();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("[pilots/active-count]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
