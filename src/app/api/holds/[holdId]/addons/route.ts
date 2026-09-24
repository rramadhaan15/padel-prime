import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bindAddonsToHold } from "@/lib/equipment";

const addonsSchema = z.object({
  racketsCount: z.number().int().min(0).max(4),
  ballsCount: z.number().int().min(0),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ holdId: string }> }
) {
  try {
    const { holdId } = await params;
    const body = await request.json();
    const parsed = addonsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid add-on selection", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = bindAddonsToHold(holdId, parsed.data.racketsCount, parsed.data.ballsCount);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to bind add-ons to hold";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
