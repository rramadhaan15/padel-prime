import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { accountForRequest, updateAccountPhone } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/payments";

const schema = z.object({ phone: z.string().trim().min(8).max(20) });

export async function PATCH(request: NextRequest) {
  const account = accountForRequest(request);
  if (!account) {
    return NextResponse.json({ success: false, error: "Sesi telah berakhir. Silakan masuk kembali." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Masukkan nomor WhatsApp yang valid." }, { status: 400 });
  }

  try {
    const phone = normalizePhoneNumber(parsed.data.phone);
    if (!/^\+[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json({ success: false, error: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }
    updateAccountPhone(account.id, phone);
    return NextResponse.json({ success: true, data: { phone } });
  } catch {
    return NextResponse.json({ success: false, error: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }
}
