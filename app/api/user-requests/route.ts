import { NextRequest, NextResponse } from 'next/server';

import { expressBackendOrigin } from "@/lib/express-backend-origin";

async function proxyUserRequests(request: NextRequest) {
  const token = request.headers.get('authorization');
  const response = await fetch(
    `${expressBackendOrigin()}/api/user-requests${request.nextUrl.search}`,
    {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: request.method === 'GET' ? undefined : await request.text(),
      cache: 'no-store',
    }
  );

  const contentType = response.headers.get('content-type');
  const body = await response.text();

  if (contentType?.includes('application/json')) {
    return NextResponse.json(body ? JSON.parse(body) : {}, { status: response.status });
  }

  return new NextResponse(body, { status: response.status });
}

export async function POST(request: NextRequest) {
  try {
    return await proxyUserRequests(request);
  } catch (error) {
    console.error('Error in user-requests POST route:', error);
    return NextResponse.json(
      { error: 'Failed to send request to admin' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return await proxyUserRequests(request);
  } catch (error) {
    console.error('Error in user-requests GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user requests' },
      { status: 500 }
    );
  }
}
