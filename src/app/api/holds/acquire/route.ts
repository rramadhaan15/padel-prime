import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { acquireSlotHold, SlotConflictError } from "@/lib/holds";

const acquireSchema = z.object({
  slotId: z.string().min(1),
  courtId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = acquireSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid hold acquisition parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await acquireSlotHold(parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof SlotConflictError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to acquire slot hold";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
