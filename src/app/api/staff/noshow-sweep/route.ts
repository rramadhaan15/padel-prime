import { NextRequest, NextResponse } from "next/server";
import { runNoShowSweep } from "@/lib/checkin";

export async function POST(request: NextRequest) {
  try {
    const sweepResult = runNoShowSweep();
    return NextResponse.json({ success: true, data: sweepResult });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sweep failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
