import { NextRequest, NextResponse } from "next/server";
import { getHoldStatus, releaseSlotHold } from "@/lib/holds";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ holdId: string }> }
) {
  try {
    const { holdId } = await params;
    const status = getHoldStatus(holdId);

    if (!status.isValid) {
      return NextResponse.json(
        { success: false, error: "Hold has expired or does not exist", data: status },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, data: status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query hold status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ holdId: string }> }
) {
  try {
    const { holdId } = await params;
    const released = await releaseSlotHold(holdId);

    return NextResponse.json({ success: released });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to release hold";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
