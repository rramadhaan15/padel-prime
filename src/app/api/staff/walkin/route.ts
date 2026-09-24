import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWalkInBooking } from "@/lib/staff";

const walkInSchema = z.object({
  slotId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional(),
  racketsCount: z.number().int().min(0).max(4).optional(),
  ballsCount: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = walkInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid walk-in parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const booking = createWalkInBooking(parsed.data);
    return NextResponse.json({ success: true, data: booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create walk-in booking";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
