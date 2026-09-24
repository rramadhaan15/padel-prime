import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTicketQrToken, generateQrCodeDataUrl } from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const booking = db.getBooking(bookingId);

    if (!booking) {
      return NextResponse.json({ success: false, error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    const slot = db.getScheduleSlot(booking.slotId);
    const court = db.getCourt(booking.courtId);

    if (!slot || !court) {
      return NextResponse.json({ success: false, error: "Data jadwal lapangan hilang." }, { status: 500 });
    }

    // Generate signed QR code token
    const qrToken = createTicketQrToken({
      bookingRef: booking.bookingRef,
      slotId: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      customerName: booking.customerName,
      issuedAt: Date.now(),
    });

    const qrDataUrl = await generateQrCodeDataUrl(qrToken);

    return NextResponse.json({
      success: true,
      data: {
        booking,
        slot,
        court,
        qrToken,
        qrDataUrl,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
