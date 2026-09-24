import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeReschedule } from "@/lib/reschedule";

const rescheduleSchema = z.object({
  bookingId: z.string().min(1),
  newSlotId: z.string().min(1),
  simulatedDeltaPaid: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = rescheduleSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reschedule parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await executeReschedule({
      bookingId: parsed.data.bookingId,
      newSlotId: parsed.data.newSlotId,
      simulatedDeltaPaid: parsed.data.simulatedDeltaPaid,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reschedule booking";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}
