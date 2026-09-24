import { describe, it, expect, beforeEach } from "vitest";
import { evaluateHoldExpiry, listConflictAlerts } from "@/lib/worker";
import { acquireSlotHold } from "@/lib/holds";
import { bindAddonsToHold } from "@/lib/equipment";
import { createPaymentTransaction, setGatewayLedgerStatus } from "@/lib/payments";
import { db } from "@/lib/db";
import { resetRedisMemoryStore } from "@/lib/redis";

describe("Hold Expiry Worker & Active Payment Inquiry (Ticket 05)", () => {
  beforeEach(() => {
    db.reset();
    resetRedisMemoryStore();
  });

  it("releases unpaid hold and returns slot and equipment to available status", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slot = db.getScheduleSlots(todayStr)[0];

    const hold = await acquireSlotHold({ slotId: slot.id });
    bindAddonsToHold(hold.holdId, 2, 1);

    await createPaymentTransaction({
      holdId: hold.holdId,
      customerName: "Bob",
      customerEmail: "bob@test.com",
      customerPhone: "08123456789",
      paymentMethod: "QRIS",
    });

    // Manually expire the hold timestamp
    db.updateSlotHold(hold.holdId, {
      expiresAt: new Date(Date.now() - 1000), // 1 sec ago
    });

    // Gateway remains unpaid (status: 'pending')
    const result = await evaluateHoldExpiry(hold.holdId);

    expect(result.action).toBe("released");

    // Slot must be back to 'open'
    expect(db.getScheduleSlot(slot.id)?.status).toBe("open");

    // Equipment stock must be restored
    const pool = db.getEquipmentStock(slot.date, slot.startTime);
    expect(pool.rentedRackets).toBe(0);
    expect(pool.soldBalls).toBe(0);
  });

  it("converts hold to Confirmed booking if active inquiry discovers payment was settled", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slot = db.getScheduleSlots(todayStr)[1];

    const hold = await acquireSlotHold({ slotId: slot.id });
    const txn = await createPaymentTransaction({
      holdId: hold.holdId,
      customerName: "Charlie",
      customerEmail: "charlie@test.com",
      customerPhone: "08123456789",
      paymentMethod: "QRIS",
    });

    // Manually mark gateway transaction as settled
    setGatewayLedgerStatus(txn.orderId, "settled");

    // Hold expires before webhook arrived
    db.updateSlotHold(hold.holdId, {
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await evaluateHoldExpiry(hold.holdId);

    expect(result.action).toBe("confirmed");

    // Slot must be booked
    expect(db.getScheduleSlot(slot.id)?.status).toBe("booked");

    // Booking record must be confirmed in database
    const booking = db.listBookings().find((b) => b.slotId === slot.id);
    expect(booking?.status).toBe("Confirmed");
    expect(booking?.customerName).toBe("Charlie");
  });

  it("flags Overdue_Payment_Conflict when payment is settled late but slot is already booked", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slot = db.getScheduleSlots(todayStr)[2];

    const hold = await acquireSlotHold({ slotId: slot.id });
    const txn = await createPaymentTransaction({
      holdId: hold.holdId,
      customerName: "Late Payer",
      customerEmail: "late@test.com",
      customerPhone: "08199998888",
      paymentMethod: "QRIS",
    });

    // Someone else took the slot and booked it
    db.updateSlotStatus(slot.id, "booked");

    // Late payer's transaction settled
    setGatewayLedgerStatus(txn.orderId, "settled");

    const result = await evaluateHoldExpiry(hold.holdId);

    expect(result.action).toBe("conflict");
    expect(result.message).toMatch(/Overdue_Payment_Conflict/i);

    const alerts = listConflictAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    const alert = alerts.find((a) => a.orderId === txn.orderId);
    expect(alert).toBeDefined();
    expect(alert?.customerName).toBe("Late Payer");
  });
});
