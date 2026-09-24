import { db, SlotHoldRecord, ScheduleSlotRecord, CourtRecord } from "../db";
import { acquireDistributedLock, releaseDistributedLock } from "../redis";

export class SlotConflictError extends Error {
  constructor(message = "Slot is already held or booked by another customer.") {
    super(message);
    this.name = "SlotConflictError";
  }
}

export interface AcquireHoldParams {
  slotId: string;
  courtId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  racketsCount?: number;
  ballsCount?: number;
}

export interface AcquireHoldResult {
  holdId: string;
  slotId: string;
  courtId: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface HoldStatusResult {
  isValid: boolean;
  remainingSeconds: number;
  hold?: SlotHoldRecord;
  slot?: ScheduleSlotRecord;
  court?: CourtRecord;
}

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Atomically acquires a pessimistic distributed hold for a schedule slot.
 */
export async function acquireSlotHold(params: AcquireHoldParams): Promise<AcquireHoldResult> {
  const { slotId } = params;
  const slot = db.getScheduleSlot(slotId);

  if (!slot) {
    throw new Error(`Schedule slot ${slotId} not found.`);
  }

  if (slot.status !== "open") {
    throw new SlotConflictError(`Slot ${slot.startTime}-${slot.endTime} is currently ${slot.status}.`);
  }

  // Check if an existing unexpired hold is in DB
  const existingHold = db.getActiveHoldForSlot(slotId);
  if (existingHold) {
    throw new SlotConflictError(`Slot is currently on hold until ${existingHold.expiresAt.toISOString()}.`);
  }

  const holdId = `hold-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const lockKey = `slot:${slotId}`;

  // Acquire distributed pessimistic lock in Redis
  const lockAcquired = await acquireDistributedLock(lockKey, holdId, HOLD_DURATION_MS);
  if (!lockAcquired) {
    throw new SlotConflictError("Concurrent hold request conflict. Slot was acquired by another user.");
  }

  try {
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    const holdRecord: SlotHoldRecord = {
      id: holdId,
      slotId: slot.id,
      courtId: slot.courtId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      racketsCount: params.racketsCount || 0,
      ballsCount: params.ballsCount || 0,
      expiresAt,
      status: "active",
      createdAt: new Date(),
    };

    db.createSlotHold(holdRecord);
    db.updateSlotStatus(slot.id, "held");

    return {
      holdId: holdRecord.id,
      slotId: slot.id,
      courtId: slot.courtId,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: Math.floor(HOLD_DURATION_MS / 1000),
    };
  } catch (err) {
    // If DB update fails, release the Redis lock immediately
    await releaseDistributedLock(lockKey, holdId);
    throw err;
  }
}

/**
 * Releases an active hold and frees the slot back to "open".
 */
export async function releaseSlotHold(holdId: string): Promise<boolean> {
  const hold = db.getSlotHold(holdId);
  if (!hold) return false;

  const lockKey = `slot:${hold.slotId}`;
  await releaseDistributedLock(lockKey, hold.id);

  db.updateSlotHold(hold.id, { status: "released" });

  const slot = db.getScheduleSlot(hold.slotId);
  if (slot && slot.status === "held") {
    db.updateSlotStatus(slot.id, "open");
  }

  // Restore equipment stock if attached
  if (hold.racketsCount > 0 || hold.ballsCount > 0) {
    if (slot) {
      try {
        db.updateEquipmentStock(slot.date, slot.startTime, -hold.racketsCount, -hold.ballsCount);
      } catch {
        // Stock already freed or adjusted
      }
    }
  }

  return true;
}

/**
 * Checks hold status and calculates remaining time.
 */
export function getHoldStatus(holdId: string): HoldStatusResult {
  const hold = db.getSlotHold(holdId);
  if (!hold) {
    return { isValid: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  const expiresAtMs = new Date(hold.expiresAt).getTime();
  const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

  if (hold.status !== "active" || remainingSeconds <= 0) {
    if (hold.status === "active") {
      // Lazy expire
      db.updateSlotHold(hold.id, { status: "expired" });
      const slot = db.getScheduleSlot(hold.slotId);
      if (slot && slot.status === "held") {
        db.updateSlotStatus(slot.id, "open");
      }
    }
    return { isValid: false, remainingSeconds: 0, hold };
  }

  const slot = db.getScheduleSlot(hold.slotId);
  const court = slot ? db.getCourt(slot.courtId) : undefined;

  return {
    isValid: true,
    remainingSeconds,
    hold,
    slot,
    court,
  };
}
