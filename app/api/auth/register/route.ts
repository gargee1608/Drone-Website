import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = "http://localhost:4000/api/auth/register";
    
    // Get the request body
    const body = await req.text();
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("Authorization") || "",
      },
      body: body,
    });

    // Get the response from backend
    const responseText = await response.text();
    
    // Return the same status and response
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Auth register proxy error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
