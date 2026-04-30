import { NextRequest, NextResponse } from "next/server";

import { insertBlog, queryAllBlogs } from "@/lib/blogs-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await queryAllBlogs();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[api/blogs] list", err);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { title?: string; content?: string; image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = body.title != null ? String(body.title).trim() : "";
  const content = body.content != null ? String(body.content) : "";
  const image = body.image != null ? String(body.image).trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const row = await insertBlog({
      title,
      content,
      image: image || "https://via.placeholder.com/400",
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("[api/blogs] create", err);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}
