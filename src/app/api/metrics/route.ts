import { NextRequest, NextResponse } from "next/server";
import { calculateCostMetrics } from "@/lib/cost-calculations";
import edrDataService from "@/lib/edr-data-service";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth("dashboard:view");
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "quarterly") as "quarterly" | "yearly" | "monthly";
    const selectedQuarter = searchParams.get("quarter") || undefined;

    // Get investment from settings store
    const g = globalThis as any;
    const settings = g.__sfSettings || {};
    const investmentAmount = settings.investmentAmount || 0;

    const costMetrics = await calculateCostMetrics({
      period,
      selectedQuarter,
      investmentAmount,
    });

    // Get sentinel status for alert counts
    const sentinelStatus = edrDataService.getSentinelStatus();

    return NextResponse.json({
      success: true,
      costMetrics,
      sentinelStatus: {
        connected: sentinelStatus.connected,
        categoryBreakdown: sentinelStatus.categoryBreakdown,
        totalFetched: sentinelStatus.totalFetched,
      },
      investmentAmount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Metrics API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
