import { db, ScheduleSlotRecord, CourtRecord, CourtType, TimeBand, SlotStatus } from "../db";

export interface AvailabilitySlot {
  id: string;
  courtId: string;
  courtName: string;
  courtType: CourtType;
  date: string;
  startTime: string;
  endTime: string;
  timeBand: TimeBand;
  price: number;
  status: SlotStatus;
  blockReason?: string | null;
}

export interface CourtAvailability {
  court: CourtRecord;
  slots: AvailabilitySlot[];
}

export interface AvailabilityGridResult {
  venueId: string;
  venueName: string;
  date: string;
  advanceDaysAllowed: number;
  courts: CourtAvailability[];
}

const PRICE_MATRIX: Record<CourtType, Record<TimeBand, number>> = {
  Indoor: {
    Regular: 350000,
    Peak: 450000,
  },
  Outdoor: {
    Regular: 250000,
    Peak: 350000,
  },
};

/**
 * Calculates authoritative price for a slot based on court type and time band.
 */
export function calculateSlotPrice(courtType: CourtType, timeBand: TimeBand): number {
  return PRICE_MATRIX[courtType][timeBand];
}

/**
 * Validates whether a target date (YYYY-MM-DD) falls within the rolling 7-day advance window.
 */
export function validateAdvanceWindow(targetDateStr: string, referenceDate: Date = new Date()): {
  isValid: boolean;
  error?: string;
  dayOffset?: number;
} {
  const refDate = new Date(referenceDate);
  refDate.setHours(0, 0, 0, 0);

  const targetParts = targetDateStr.split("-").map(Number);
  if (targetParts.length !== 3 || isNaN(targetParts[0]) || isNaN(targetParts[1]) || isNaN(targetParts[2])) {
    return { isValid: false, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  const targetDate = new Date(targetParts[0], targetParts[1] - 1, targetParts[2]);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { isValid: false, error: "Cannot query past dates.", dayOffset: diffDays };
  }

  if (diffDays > 7) {
    return {
      isValid: false,
      error: `Date is outside the rolling 7-day advance window (requested ${diffDays} days in advance, max allowed is 7).`,
      dayOffset: diffDays,
    };
  }

  return { isValid: true, dayOffset: diffDays };
}

/**
 * Lazily expires any active hold that has passed its TTL and restores slot status to "open".
 */
export function cleanExpiredHoldsJIT(): number {
  const expiredHolds = db.listExpiredHolds();
  let count = 0;
  for (const hold of expiredHolds) {
    db.updateSlotHold(hold.id, { status: "expired" });
    const slot = db.getScheduleSlot(hold.slotId);
    if (slot && slot.status === "held") {
      db.updateSlotStatus(slot.id, "open");
    }
    // Also restore equipment stock if any
    if (hold.racketsCount > 0 || hold.ballsCount > 0) {
      if (slot) {
        try {
          db.updateEquipmentStock(slot.date, slot.startTime, -hold.racketsCount, -hold.ballsCount);
        } catch {
          // Ignore stock release errors on stale items
        }
      }
    }
    count++;
  }
  return count;
}

/**
 * Retrieves the availability grid for all courts in the venue for a given date.
 */
export function getAvailabilityGrid(venueId: string, dateStr: string): AvailabilityGridResult {
  const windowCheck = validateAdvanceWindow(dateStr);
  if (!windowCheck.isValid) {
    throw new Error(windowCheck.error);
  }

  // Lazy Just-in-Time expiry of stale holds
  cleanExpiredHoldsJIT();

  const venue = db.getVenue();
  const allCourts = db.listCourts().filter((c) => c.isActive);
  const slotsForDate = db.getScheduleSlots(dateStr);

  const courtsAvailability: CourtAvailability[] = allCourts.map((court) => {
    const courtSlots = slotsForDate
      .filter((s) => s.courtId === court.id)
      .map((s) => ({
        id: s.id,
        courtId: court.id,
        courtName: court.name,
        courtType: court.type,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        timeBand: s.timeBand,
        price: calculateSlotPrice(court.type, s.timeBand),
        status: s.status,
        blockReason: s.blockReason,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      court,
      slots: courtSlots,
    };
  });

  return {
    venueId: venue.id,
    venueName: venue.name,
    date: dateStr,
    advanceDaysAllowed: 7,
    courts: courtsAvailability,
  };
}

/**
 * Staff administrative actions: block a slot
 */
export function blockSlot(slotId: string, reason: string): ScheduleSlotRecord {
  const slot = db.getScheduleSlot(slotId);
  if (!slot) throw new Error(`Slot ${slotId} not found.`);
  if (slot.status === "booked") {
    throw new Error("Cannot block a slot that has already been booked by a customer.");
  }
  return db.updateSlotStatus(slotId, "blocked", reason);
}

/**
 * Staff administrative actions: unblock a slot
 */
export function unblockSlot(slotId: string): ScheduleSlotRecord {
  const slot = db.getScheduleSlot(slotId);
  if (!slot) throw new Error(`Slot ${slotId} not found.`);
  if (slot.status !== "blocked") {
    throw new Error(`Slot ${slotId} is not currently blocked.`);
  }
  return db.updateSlotStatus(slotId, "open", null);
}
