import { NextRequest, NextResponse } from "next/server";

import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const backendUrl = `${expressBackendOrigin()}/api/auth/change-password`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  const authorization = req.headers.get("authorization");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        message: "Backend unreachable",
        detail,
        hint: "Start `npm run dev` so the API is available on port 4000, or set `BACKEND_URL`.",
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  const responseText = await response.text();
  return new NextResponse(responseText, {
    status: response.status,
    headers: responseHeaders,
  });
}
