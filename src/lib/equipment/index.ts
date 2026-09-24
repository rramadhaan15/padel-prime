import { db, SlotHoldRecord } from "../db";

export const RACKET_RENTAL_PRICE = 50000; // IDR per racket
export const BALL_CAN_PRICE = 120000; // IDR per can (3 balls)
export const MAX_RACKETS_PER_SLOT = 4; // Max 4 rackets per court slot

export interface EquipmentAvailability {
  date: string;
  timeSlot: string;
  totalRackets: number;
  availableRackets: number;
  totalBalls: number;
  availableBalls: number;
  racketRentalPrice: number;
  ballCanPrice: number;
  maxRacketsPerSlot: number;
}

export interface PricingBreakdown {
  slotPrice: number;
  racketsCount: number;
  racketsPrice: number;
  ballsCount: number;
  ballsPrice: number;
  addonsTotal: number;
  grandTotal: number;
}

export interface BindAddonsResult {
  hold: SlotHoldRecord;
  pricing: PricingBreakdown;
}

/**
 * Retrieves the available equipment stock for a specific date and time slot.
 */
export function getAvailableEquipment(date: string, timeSlot: string): EquipmentAvailability {
  const pool = db.getEquipmentStock(date, timeSlot);
  return {
    date,
    timeSlot,
    totalRackets: pool.totalRackets,
    availableRackets: Math.max(0, pool.totalRackets - pool.rentedRackets),
    totalBalls: pool.totalBalls,
    availableBalls: Math.max(0, pool.totalBalls - pool.soldBalls),
    racketRentalPrice: RACKET_RENTAL_PRICE,
    ballCanPrice: BALL_CAN_PRICE,
    maxRacketsPerSlot: MAX_RACKETS_PER_SLOT,
  };
}

/**
 * Atomically binds equipment add-ons to an active slot hold.
 */
export function bindAddonsToHold(
  holdId: string,
  racketsCount: number,
  ballsCount: number
): BindAddonsResult {
  const hold = db.getSlotHold(holdId);
  if (!hold) {
    throw new Error(`Hold ${holdId} not found.`);
  }

  if (hold.status !== "active" || new Date(hold.expiresAt).getTime() <= Date.now()) {
    throw new Error("Cannot attach add-ons: Slot hold has expired or is inactive.");
  }

  // Enforce per-slot racket rental limit
  if (racketsCount < 0 || racketsCount > MAX_RACKETS_PER_SLOT) {
    throw new Error(`Racket rentals are restricted to a maximum of ${MAX_RACKETS_PER_SLOT} rackets per schedule slot.`);
  }

  if (ballsCount < 0) {
    throw new Error("Ball count cannot be negative.");
  }

  const slot = db.getScheduleSlot(hold.slotId);
  if (!slot) {
    throw new Error(`Associated slot ${hold.slotId} not found.`);
  }

  // Calculate delta stock changes compared to previously bound add-ons on this hold
  const deltaRackets = racketsCount - hold.racketsCount;
  const deltaBalls = ballsCount - hold.ballsCount;

  // Atomically update equipment pool stock
  db.updateEquipmentStock(slot.date, slot.startTime, deltaRackets, deltaBalls);

  // Update hold record
  const updatedHold = db.updateSlotHold(hold.id, {
    racketsCount,
    ballsCount,
  });

  const slotPrice = slot.price;
  const racketsPrice = racketsCount * RACKET_RENTAL_PRICE;
  const ballsPrice = ballsCount * BALL_CAN_PRICE;
  const addonsTotal = racketsPrice + ballsPrice;
  const grandTotal = slotPrice + addonsTotal;

  return {
    hold: updatedHold,
    pricing: {
      slotPrice,
      racketsCount,
      racketsPrice,
      ballsCount,
      ballsPrice,
      addonsTotal,
      grandTotal,
    },
  };
}
