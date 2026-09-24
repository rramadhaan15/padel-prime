import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processPaymentWebhook } from "@/lib/payments";

const webhookSchema = z.object({
  orderId: z.string(),
  statusCode: z.string(),
  grossAmount: z.number(),
  transactionStatus: z.enum(["settlement", "capture", "expire", "cancel"]),
  signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = webhookSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { booking, isDuplicate } = await processPaymentWebhook(parsed.data);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        status: booking.status,
        isDuplicate,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
