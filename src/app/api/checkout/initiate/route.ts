import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentTransaction } from "@/lib/payments";

const initiateSchema = z.object({
  holdId: z.string().min(1),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(8, "Valid phone number is required"),
  paymentMethod: z.enum(["QRIS", "VA_BCA", "VA_MANDIRI"]),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = initiateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createPaymentTransaction(parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate payment transaction";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
