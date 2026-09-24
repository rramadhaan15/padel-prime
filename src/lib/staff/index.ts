import crypto from "crypto";
import { db, BookingRecord, ScheduleSlotRecord } from "../db";
import { normalizePhoneNumber } from "../payments";
import { RACKET_RENTAL_PRICE, BALL_CAN_PRICE } from "../equipment";

export const STAFF_PIN = process.env.STAFF_PIN || "padel888";

export function validateStaffPin(pin: string): boolean {
  return pin === STAFF_PIN;
}

export interface OccupancyStats {
  date: string;
  totalSlots: number;
  openSlots: number;
  heldSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  occupancyRatePercent: number;
  totalEstimatedRevenue: number;
}

export interface EquipmentStagingItem {
  timeSlot: string;
  courtName: string;
  customerName: string;
  racketsCount: number;
  ballsCount: number;
}

export interface EquipmentStagingSummary {
  date: string;
  totalRacketsToStage: number;
  totalBallsToStage: number;
  items: EquipmentStagingItem[];
}

/**
 * Computes daily court occupancy statistics and revenue metrics.
 */
export function getDailyOccupancyStats(date: string): OccupancyStats {
  const slots = db.getScheduleSlots(date);
  const totalSlots = slots.length;

  let openSlots = 0;
  let heldSlots = 0;
  let bookedSlots = 0;
  let blockedSlots = 0;

  for (const s of slots) {
    if (s.status === "open") openSlots++;
    else if (s.status === "held") heldSlots++;
    else if (s.status === "booked") bookedSlots++;
    else if (s.status === "blocked") blockedSlots++;
  }

  const occupancyRatePercent = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  const bookingsForDate = db.listBookings({ date });
  const totalEstimatedRevenue = bookingsForDate.reduce((sum, b) => sum + b.totalAmount, 0);

  return {
    date,
    totalSlots,
    openSlots,
    heldSlots,
    bookedSlots,
    blockedSlots,
    occupancyRatePercent,
    totalEstimatedRevenue,
  };
}

/**
 * Aggregates equipment preparation requirements for front desk venue staff.
 */
export function getEquipmentStagingSummary(date: string): EquipmentStagingSummary {
  const bookingsForDate = db.listBookings({ date });
  const items: EquipmentStagingItem[] = [];

  let totalRacketsToStage = 0;
  let totalBallsToStage = 0;

  for (const b of bookingsForDate) {
    if (b.racketsCount > 0 || b.ballsCount > 0) {
      const slot = db.getScheduleSlot(b.slotId);
      const court = db.getCourt(b.courtId);

      items.push({
        timeSlot: slot ? `${slot.startTime} - ${slot.endTime}` : "N/A",
        courtName: court ? court.name : "Court",
        customerName: b.customerName,
        racketsCount: b.racketsCount,
        ballsCount: b.ballsCount,
      });

      totalRacketsToStage += b.racketsCount;
      totalBallsToStage += b.ballsCount;
    }
  }

  return {
    date,
    totalRacketsToStage,
    totalBallsToStage,
    items,
  };
}

/**
 * Creates an on-site walk-in reservation directly by venue staff.
 */
export function createWalkInBooking(params: {
  slotId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  racketsCount?: number;
  ballsCount?: number;
}): BookingRecord {
  const { slotId, customerName, customerPhone, customerEmail, racketsCount = 0, ballsCount = 0 } = params;

  const slot = db.getScheduleSlot(slotId);
  if (!slot) {
    throw new Error(`Slot ${slotId} not found.`);
  }

  if (slot.status !== "open") {
    throw new Error(`Slot is currently ${slot.status}. Cannot book walk-in.`);
  }

  const normalizedPhone = normalizePhoneNumber(customerPhone);
  const email = customerEmail || `${normalizedPhone.replace(/\+/g, "")}@walkin.padelprime.com`;

  // Upsert customer
  db.upsertCustomer({
    name: customerName,
    email,
    phone: normalizedPhone,
  });

  // Verify racket limit
  if (racketsCount > 4) {
    throw new Error("Racket rentals are limited to 4 units per court slot.");
  }

  // Update equipment pool stock
  if (racketsCount > 0 || ballsCount > 0) {
    db.updateEquipmentStock(slot.date, slot.startTime, racketsCount, ballsCount);
  }

  // Generate Booking Reference
  const dateCompact = slot.date.replace(/-/g, "");
  const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingRef = `BK-WALKIN-${dateCompact}-${randAlpha}`;

  // Sign QR verification code
  const qrSecret = process.env.QR_SECRET || "padel_qr_hmac_secret_2026";
  const qrPayloadRaw = `${bookingRef}:${slot.id}:${slot.date}:${slot.startTime}`;
  const qrSignature = crypto.createHmac("sha256", qrSecret).update(qrPayloadRaw).digest("hex");

  const slotPrice = slot.price;
  const addonsPrice = racketsCount * RACKET_RENTAL_PRICE + ballsCount * BALL_CAN_PRICE;

  const booking: BookingRecord = {
    id: `bk-walkin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookingRef,
    slotId: slot.id,
    courtId: slot.courtId,
    customerName,
    customerEmail: email,
    customerPhone: normalizedPhone,
    racketsCount,
    ballsCount,
    slotPrice,
    addonsPrice,
    totalAmount: slotPrice + addonsPrice,
    paymentMethod: "WALK_IN",
    paymentStatus: "settled",
    status: "Confirmed",
    qrSignature,
    createdAt: new Date(),
  };

  db.updateSlotStatus(slot.id, "booked");
  db.createBooking(booking);

  return booking;
}
