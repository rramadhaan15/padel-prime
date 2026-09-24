import { NextRequest, NextResponse } from "next/server";
import { getDailyOccupancyStats, getEquipmentStagingSummary } from "@/lib/staff";
import { listConflictAlerts } from "@/lib/worker";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const stats = getDailyOccupancyStats(date);
    const staging = getEquipmentStagingSummary(date);
    const alerts = listConflictAlerts();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        staging,
        alerts,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load staff stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
