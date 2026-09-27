import { NextRequest, NextResponse } from "next/server";
import { generateGatewaySignature, processPaymentWebhook, getGatewayLedgerEntry } from "@/lib/payments";
import { ownsHold } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }

    if (typeof orderId !== "string" || !orderId.startsWith("PAY-") || !ownsHold(request, orderId.slice(4))) {
      return NextResponse.json({ success: false, error: "Pembayaran tidak ditemukan." }, { status: 404 });
    }

    const entry = getGatewayLedgerEntry(orderId);
    const amount = entry ? entry.amount : 350000;
    const statusCode = "200";

    const signature = generateGatewaySignature(orderId, statusCode, amount);

    const result = await processPaymentWebhook({
      orderId,
      statusCode,
      grossAmount: amount,
      transactionStatus: "settlement",
      signature,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Simulated settlement failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
