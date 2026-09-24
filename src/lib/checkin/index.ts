import { db, BookingRecord, CustomerRecord, ScheduleSlotRecord, CourtRecord } from "../db";
import { verifyTicketQrToken } from "../tickets";

export interface CheckInSuccessResult {
  booking: BookingRecord;
  slot: ScheduleSlotRecord;
  court: CourtRecord;
  customer?: CustomerRecord;
  checkedInAt: string;
}

/**
 * Validates cryptographic QR token or booking reference and transitions booking to "Checked-In".
 */
export async function verifyAndCheckIn(tokenOrRef: string): Promise<CheckInSuccessResult> {
  let bookingRef = tokenOrRef.trim();

  // If token is signed JWT/HMAC token (contains ".")
  if (tokenOrRef.includes(".")) {
    const verification = verifyTicketQrToken(tokenOrRef);
    if (!verification.isValid || !verification.payload) {
      throw new Error(verification.error || "Invalid or tampered QR Code signature.");
    }
    bookingRef = verification.payload.bookingRef;
  }

  const booking = db.getBookingByRef(bookingRef);
  if (!booking) {
    throw new Error(`Booking reference ${bookingRef} not found.`);
  }

  if (booking.status === "Checked-In") {
    const timeStr = booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString("id-ID") : "";
    throw new Error(`Ticket has ALREADY been checked-in at ${timeStr}. Duplicate entry rejected.`);
  }

  if (booking.status === "Rescheduled") {
    throw new Error("This ticket was rescheduled. Please present the new digital pass.");
  }

  if (booking.status === "No-Show") {
    throw new Error("This booking has expired and was marked as No-Show.");
  }

  const slot = db.getScheduleSlot(booking.slotId);
  const court = db.getCourt(booking.courtId);
  if (!slot || !court) {
    throw new Error("Schedule or court details could not be resolved.");
  }

  const now = new Date();
  const updatedBooking = db.updateBooking(booking.id, {
    status: "Checked-In",
    checkedInAt: now,
  });

  let customer = db.getCustomer(booking.customerPhone);
  if (!customer) {
    customer = db.upsertCustomer({
      phone: booking.customerPhone,
      name: booking.customerName,
      email: booking.customerEmail,
    });
  }

  return {
    booking: updatedBooking,
    slot,
    court,
    customer,
    checkedInAt: now.toISOString(),
  };
}

/**
 * Searches bookings by customer phone, name, or booking reference.
 */
export function searchBookings(query: string): Array<{
  booking: BookingRecord;
  slot?: ScheduleSlotRecord;
  court?: CourtRecord;
  customer?: CustomerRecord;
}> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const allBookings = db.listBookings();

  const matched = allBookings.filter((b) => {
    return (
      b.bookingRef.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q)
    );
  });

  return matched.map((b) => ({
    booking: b,
    slot: db.getScheduleSlot(b.slotId),
    court: db.getCourt(b.courtId),
    customer: db.getCustomer(b.customerPhone),
  }));
}

/**
 * Automated sweep worker: transitions past-due unchecked bookings to "No-Show"
 * and flags customers who accumulate 3 or more no-shows.
 */
export function runNoShowSweep(referenceTime: Date = new Date()): {
  transitionedCount: number;
  noShowBookings: BookingRecord[];
  flaggedCustomers: CustomerRecord[];
} {
  const confirmedBookings = db.listBookings({ status: "Confirmed" });
  const noShowBookings: BookingRecord[] = [];
  const flaggedCustomers: CustomerRecord[] = [];

  const refTimeMs = referenceTime.getTime();

  for (const b of confirmedBookings) {
    const slot = db.getScheduleSlot(b.slotId);
    if (!slot) continue;

    const slotEndTimeObj = new Date(`${slot.date}T${slot.endTime}:00`);
    if (refTimeMs > slotEndTimeObj.getTime()) {
      // Slot end time has elapsed without customer checking in!
      const updatedBooking = db.updateBooking(b.id, {
        status: "No-Show",
      });
      noShowBookings.push(updatedBooking);

      // Increment customer no-show counter
      const customer = db.incrementCustomerNoShow(b.customerPhone);
      if (customer.isFlagged && !flaggedCustomers.some((c) => c.phone === customer.phone)) {
        flaggedCustomers.push(customer);
      }
    }
  }

  return {
    transitionedCount: noShowBookings.length,
    noShowBookings,
    flaggedCustomers,
  };
}
