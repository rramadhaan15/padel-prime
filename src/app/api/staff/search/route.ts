import { NextRequest, NextResponse } from "next/server";
import { searchBookings } from "@/lib/checkin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const results = searchBookings(q);
    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
