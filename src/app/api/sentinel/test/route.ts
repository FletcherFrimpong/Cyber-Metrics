// POST /api/sentinel/test
// Tests Sentinel connection with provided credentials (without saving them).

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, clientId, clientSecret } = body;

    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: tenantId, clientId, clientSecret" },
        { status: 400 }
      );
    }

    // Lazy import to avoid loading Azure SDK until needed
    const { SentinelClient } = await import("@/lib/sentinel-client");

    const client = new SentinelClient({
      tenantId,
      clientId,
      clientSecret,
      pollingIntervalMs: 900000,
    });

    const result = await client.healthCheck();

    return NextResponse.json({
      success: result.ok,
      error: result.error || null,
      message: result.ok
        ? "Successfully connected to Microsoft Sentinel"
        : `Connection failed: ${result.error}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: `Connection failed: ${error.message}`,
    });
  }
}
