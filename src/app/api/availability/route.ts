import { NextRequest, NextResponse } from "next/server";
import { getAvailabilityGrid } from "@/lib/scheduling";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const venueId = searchParams.get("venueId") || "venue-padel-prime";

    const grid = getAvailabilityGrid(venueId, date);
    return NextResponse.json({ success: true, data: grid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch availability grid";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
