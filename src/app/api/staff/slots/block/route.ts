import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { blockSlot } from "@/lib/scheduling";

const blockSchema = z.object({
  slotId: z.string().min(1),
  reason: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = blockSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid block parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const slot = blockSlot(parsed.data.slotId, parsed.data.reason);
    return NextResponse.json({ success: true, data: slot });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to block slot";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
