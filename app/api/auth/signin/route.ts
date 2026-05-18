import { NextRequest, NextResponse } from "next/server";

import { handleAuthSignIn, type SignInBody } from "@/lib/auth-signin";
import { expressBackendOrigin } from "@/lib/express-backend-origin";

export const dynamic = "force-dynamic";

async function proxyToExpress(body: string) {
  const backendUrl = `${expressBackendOrigin()}/api/auth/signin`;
  const response = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const responseText = await response.text();
  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function POST(req: NextRequest) {
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch (error) {
    console.error("Auth signin read body error:", error);
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  let parsed: SignInBody;
  try {
    parsed = JSON.parse(bodyText) as SignInBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await handleAuthSignIn(parsed);
    if ("ok" in result && result.ok) {
      return NextResponse.json({
        ok: true,
        token: result.token,
        role: result.role,
        user: result.user,
      });
    }
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Auth signin handler error:", error);
  }

  try {
    return await proxyToExpress(bodyText);
  } catch (error) {
    console.error("Auth signin proxy error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Backend unreachable",
        message:
          "Could not sign in. Start PostgreSQL, then run `npm run dev` (starts Next + API on port 4000).",
        detail,
        hint: "Run `cd backend && npm run dev` or set BACKEND_URL if the API runs elsewhere.",
      },
      { status: 502 }
    );
  }
}
