import { describe, it, expect, beforeEach } from "vitest";
import { validateRescheduleCutoff, executeReschedule } from "@/lib/reschedule";
import { db } from "@/lib/db";

describe("Self-Service Reschedule & Asymmetric Pricing (Ticket 07)", () => {
  beforeEach(() => {
    db.reset();
  });

  describe("24-Hour Reschedule Cutoff Rule", () => {
    it("allows reschedule when submitted 24 hours and 1 minute before game time", () => {
      const slotDate = "2026-09-26";
      const slotStartTime = "10:00";
      // 24 hours + 1 minute before: 2026-09-25 09:59
      const refTime = new Date("2026-09-25T09:59:00");

      const check = validateRescheduleCutoff(slotDate, slotStartTime, refTime);
      expect(check.allowed).toBe(true);
      expect(check.hoursRemaining).toBeGreaterThan(24);
    });

    it("strictly rejects reschedule when submitted 23 hours and 59 minutes before game time", () => {
      const slotDate = "2026-09-26";
      const slotStartTime = "10:00";
      // 23 hours 59 minutes before: 2026-09-25 10:01
      const refTime = new Date("2026-09-25T10:01:00");

      const check = validateRescheduleCutoff(slotDate, slotStartTime, refTime);
      expect(check.allowed).toBe(false);
      expect(check.error).toMatch(/at least 24 hours prior/i);
    });
  });

  describe("Asymmetric Price Adjustments & Slot Migration", () => {
    it("handles UPGRADE: requires delta payment and migrates slot", async () => {
      // Create a booking on an Outdoor Regular slot (Rp 250.000)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const slots = db.getScheduleSlots(futureDateStr);
      // Find outdoor regular slot
      const outdoorRegSlot = slots.find((s) => s.courtId.includes("court-3") && s.timeBand === "Regular")!;
      outdoorRegSlot.price = 250000;
      outdoorRegSlot.status = "booked";

      // Target indoor peak slot (Rp 450.000)
      const indoorPeakSlot = slots.find((s) => s.courtId.includes("court-1") && s.timeBand === "Peak")!;
      indoorPeakSlot.price = 450000;
      indoorPeakSlot.status = "open";

      const booking = db.createBooking({
        id: "bk-upgrade-test",
        bookingRef: "BK-UPGRADE-1",
        slotId: outdoorRegSlot.id,
        courtId: outdoorRegSlot.courtId,
        customerName: "Upgrader",
        customerEmail: "up@test.com",
        customerPhone: "+6281111111",
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: 250000,
        addonsPrice: 0,
        totalAmount: 250000,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig",
        createdAt: new Date(),
      });

      // 1. Without delta payment, requires payment
      const paymentCheck = await executeReschedule({
        bookingId: booking.id,
        newSlotId: indoorPeakSlot.id,
        simulatedDeltaPaid: false,
        referenceTime: new Date(Date.now()), // well within cutoff
      });
      expect(paymentCheck.requiresPayment).toBe(true);
      expect(paymentCheck.deltaPrice).toBe(200000); // 450k - 250k

      // 2. With delta payment confirmed, executes migration
      const migrated = await executeReschedule({
        bookingId: booking.id,
        newSlotId: indoorPeakSlot.id,
        simulatedDeltaPaid: true,
        referenceTime: new Date(Date.now()),
      });

      expect(migrated.success).toBe(true);
      expect(migrated.booking?.slotId).toBe(indoorPeakSlot.id);
      expect(migrated.booking?.slotPrice).toBe(450000);
      expect(migrated.booking?.totalAmount).toBe(450000);

      // Old slot should be freed back to open
      expect(db.getScheduleSlot(outdoorRegSlot.id)?.status).toBe("open");
      // New slot should now be booked
      expect(db.getScheduleSlot(indoorPeakSlot.id)?.status).toBe("booked");
    });

    it("handles DOWNGRADE: migrates immediately with zero cash refund and forfeits surplus", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const slots = db.getScheduleSlots(futureDateStr);
      // Original: Indoor Peak (Rp 450.000)
      const indoorPeakSlot = slots.find((s) => s.courtId.includes("court-1") && s.timeBand === "Peak")!;
      indoorPeakSlot.price = 450000;
      indoorPeakSlot.status = "booked";

      // Target: Outdoor Regular (Rp 250.000)
      const outdoorRegSlot = slots.find((s) => s.courtId.includes("court-3") && s.timeBand === "Regular")!;
      outdoorRegSlot.price = 250000;
      outdoorRegSlot.status = "open";

      const booking = db.createBooking({
        id: "bk-downgrade-test",
        bookingRef: "BK-DOWNGRADE-1",
        slotId: indoorPeakSlot.id,
        courtId: indoorPeakSlot.courtId,
        customerName: "Downgrader",
        customerEmail: "down@test.com",
        customerPhone: "+6282222222",
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: 450000,
        addonsPrice: 0,
        totalAmount: 450000,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig",
        createdAt: new Date(),
      });

      const result = await executeReschedule({
        bookingId: booking.id,
        newSlotId: outdoorRegSlot.id,
        referenceTime: new Date(Date.now()),
      });

      expect(result.success).toBe(true);
      expect(result.deltaPrice).toBe(0);
      expect(result.forfeitedPrice).toBe(200000); // 450k - 250k forfeited
      expect(result.message).toMatch(/hangus tanpa refund tunai/i);

      // Slots migrated
      expect(db.getScheduleSlot(indoorPeakSlot.id)?.status).toBe("open");
      expect(db.getScheduleSlot(outdoorRegSlot.id)?.status).toBe("booked");
    });
  });
});
