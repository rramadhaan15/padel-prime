import { NextRequest, NextResponse } from "next/server";
import { getAvailableEquipment } from "@/lib/equipment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");

    if (!date || !timeSlot) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters: date and timeSlot" },
        { status: 400 }
      );
    }

    const availability = getAvailableEquipment(date, timeSlot);
    return NextResponse.json({ success: true, data: availability });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query equipment availability";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
