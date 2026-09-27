import { NextRequest, NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
