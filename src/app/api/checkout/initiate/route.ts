import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentTransaction } from "@/lib/payments";
import { accountForRequest, ownsHold } from "@/lib/auth";

const initiateSchema = z.object({
  holdId: z.string().min(1),
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

    if (!ownsHold(request, parsed.data.holdId)) {
      return NextResponse.json({ success: false, error: "Hold tidak ditemukan." }, { status: 404 });
    }

    const account = accountForRequest(request);
    if (!account?.phone) {
      return NextResponse.json({ success: false, error: "Lengkapi nomor WhatsApp akun terlebih dahulu." }, { status: 400 });
    }

    const result = await createPaymentTransaction({
      ...parsed.data,
      customerName: account.name,
      customerEmail: account.email,
      customerPhone: account.phone,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate payment transaction";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
