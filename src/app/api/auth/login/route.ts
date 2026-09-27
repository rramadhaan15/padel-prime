import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyAccount, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Masukkan email dan kata sandi yang valid." }, { status: 400 });
  }

  try {
    const account = verifyAccount(parsed.data.email, parsed.data.password);
    if (!account) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, createSession(account.id), sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Belum dapat masuk. Coba lagi nanti." }, { status: 500 });
  }
}
