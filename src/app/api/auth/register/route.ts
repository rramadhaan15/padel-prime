import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, registerAccount, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Isi nama, email, dan kata sandi minimal 10 karakter." }, { status: 400 });
  }

  try {
    const account = registerAccount(parsed.data.name, parsed.data.email, parsed.data.password);
    if (!account) {
      return NextResponse.json({ error: "Email ini sudah terdaftar. Silakan masuk." }, { status: 409 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, createSession(account.id), sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Akun belum dapat dibuat. Coba lagi nanti." }, { status: 500 });
  }
}
