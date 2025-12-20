/**
 * Health check endpoint for Next.js web app
 * Used by Docker healthcheck and load balancers
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'web',
    },
    { status: 200 }
  );
}

