import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unblockSlot } from "@/lib/scheduling";

const unblockSchema = z.object({
  slotId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = unblockSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid unblock parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const slot = unblockSlot(parsed.data.slotId);
    return NextResponse.json({ success: true, data: slot });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to unblock slot";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
