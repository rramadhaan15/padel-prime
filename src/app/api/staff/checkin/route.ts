import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndCheckIn } from "@/lib/checkin";

const checkInSchema = z.object({
  tokenOrRef: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = checkInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Missing QR code token or booking reference." },
        { status: 400 }
      );
    }

    const result = await verifyAndCheckIn(parsed.data.tokenOrRef);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete check-in";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
