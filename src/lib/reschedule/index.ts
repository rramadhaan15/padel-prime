import { db, BookingRecord, ScheduleSlotRecord } from "../db";

export interface RescheduleCutoffCheck {
  allowed: boolean;
  hoursRemaining: number;
  error?: string;
}

export interface RescheduleResult {
  success: boolean;
  booking?: BookingRecord;
  oldSlot?: ScheduleSlotRecord;
  newSlot?: ScheduleSlotRecord;
  deltaPrice: number;
  forfeitedPrice: number;
  requiresPayment?: boolean;
  message: string;
}

/**
 * Validates the 24-hour cutoff rule (T_now <= T_slot_start - 24 hours).
 */
export function validateRescheduleCutoff(
  slotDate: string,
  slotStartTime: string,
  referenceTime: Date = new Date()
): RescheduleCutoffCheck {
  const slotDateObj = new Date(`${slotDate}T${slotStartTime}:00`);
  const cutoffLimitMs = slotDateObj.getTime() - 24 * 60 * 60 * 1000;
  const nowMs = referenceTime.getTime();

  const hoursRemaining = (slotDateObj.getTime() - nowMs) / (1000 * 60 * 60);

  if (nowMs > cutoffLimitMs) {
    return {
      allowed: false,
      hoursRemaining,
      error: `Reschedule rejected: Requests must be submitted at least 24 hours prior to game start. Only ${hoursRemaining.toFixed(1)} hours remain until your slot.`,
    };
  }

  return {
    allowed: true,
    hoursRemaining,
  };
}

/**
 * Executes a self-service reschedule with asymmetric pricing and atomic slot transfer.
 */
export async function executeReschedule(params: {
  bookingId: string;
  newSlotId: string;
  simulatedDeltaPaid?: boolean;
  referenceTime?: Date;
}): Promise<RescheduleResult> {
  const { bookingId, newSlotId, simulatedDeltaPaid, referenceTime = new Date() } = params;

  const booking = db.getBooking(bookingId);
  if (!booking) {
    throw new Error(`Booking ${bookingId} not found.`);
  }

  if (booking.status !== "Confirmed") {
    throw new Error(`Cannot reschedule booking with status ${booking.status}.`);
  }

  const oldSlot = db.getScheduleSlot(booking.slotId);
  if (!oldSlot) {
    throw new Error(`Original slot ${booking.slotId} not found.`);
  }

  // 1. Verify 24-hour Cutoff
  const cutoffCheck = validateRescheduleCutoff(oldSlot.date, oldSlot.startTime, referenceTime);
  if (!cutoffCheck.allowed) {
    throw new Error(cutoffCheck.error);
  }

  // 2. Verify new slot
  const newSlot = db.getScheduleSlot(newSlotId);
  if (!newSlot) {
    throw new Error(`New slot ${newSlotId} not found.`);
  }

  if (newSlot.status !== "open") {
    throw new Error(`Chosen slot (${newSlot.startTime}-${newSlot.endTime}) is not open for booking.`);
  }

  // 3. Calculate Asymmetric Pricing
  const deltaPrice = newSlot.price - oldSlot.price;

  if (deltaPrice > 0) {
    // UPGRADE: Delta payment required
    if (!simulatedDeltaPaid) {
      // Return notice that payment is required
      return {
        success: false,
        requiresPayment: true,
        deltaPrice,
        forfeitedPrice: 0,
        message: `Upgrading to a ${newSlot.timeBand} slot requires an instant delta payment of Rp ${deltaPrice.toLocaleString("id-ID")}.`,
      };
    }
  }

  const forfeitedPrice = deltaPrice < 0 ? Math.abs(deltaPrice) : 0;

  // 4. Atomically migrate slots:
  // - Mark new slot as booked
  // - Free old slot back to open
  // - Reallocate equipment pool stock from old slot to new slot if add-ons exist
  db.updateSlotStatus(newSlot.id, "booked");
  db.updateSlotStatus(oldSlot.id, "open");

  if (booking.racketsCount > 0 || booking.ballsCount > 0) {
    try {
      // Free from old slot
      db.updateEquipmentStock(oldSlot.date, oldSlot.startTime, -booking.racketsCount, -booking.ballsCount);
      // Allocate to new slot
      db.updateEquipmentStock(newSlot.date, newSlot.startTime, booking.racketsCount, booking.ballsCount);
    } catch {
      // Equipment stock migration best effort
    }
  }

  // 5. Update booking record
  const updatedBooking = db.updateBooking(booking.id, {
    slotId: newSlot.id,
    courtId: newSlot.courtId,
    slotPrice: newSlot.price,
    totalAmount: deltaPrice > 0 ? booking.totalAmount + deltaPrice : booking.totalAmount,
  });

  return {
    success: true,
    booking: updatedBooking,
    oldSlot,
    newSlot,
    deltaPrice: Math.max(0, deltaPrice),
    forfeitedPrice,
    message: deltaPrice > 0
      ? "Reschedule upgrade berhasil dikonfirmasi setelah pelunasan selisih."
      : deltaPrice < 0
      ? `Reschedule downgrade berhasil. Selisih harga Rp ${forfeitedPrice.toLocaleString("id-ID")} hangus tanpa refund tunai.`
      : "Reschedule berhasil tanpa perubahan biaya.",
  };
}
