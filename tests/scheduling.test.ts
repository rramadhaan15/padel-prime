import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateSlotPrice,
  validateAdvanceWindow,
  getAvailabilityGrid,
  blockSlot,
  unblockSlot,
} from "@/lib/scheduling";
import { db } from "@/lib/db";

describe("Scheduling & Availability Grid (Ticket 01)", () => {
  beforeEach(() => {
    db.reset();
  });

  describe("Pricing Matrix", () => {
    it("calculates correct prices according to court type and time band", () => {
      expect(calculateSlotPrice("Indoor", "Regular")).toBe(350000);
      expect(calculateSlotPrice("Indoor", "Peak")).toBe(450000);
      expect(calculateSlotPrice("Outdoor", "Regular")).toBe(250000);
      expect(calculateSlotPrice("Outdoor", "Peak")).toBe(350000);
    });
  });

  describe("Rolling 7-Day Advance Window", () => {
    const today = new Date("2026-09-24T10:00:00Z");

    it("allows bookings for today and dates within 7 days", () => {
      expect(validateAdvanceWindow("2026-09-24", today).isValid).toBe(true);
      expect(validateAdvanceWindow("2026-09-27", today).isValid).toBe(true);
      expect(validateAdvanceWindow("2026-10-01", today).isValid).toBe(true); // exactly 7 days
    });

    it("rejects bookings in the past", () => {
      const past = validateAdvanceWindow("2026-09-23", today);
      expect(past.isValid).toBe(false);
      expect(past.error).toMatch(/past/i);
    });

    it("rejects bookings beyond the 7-day advance window", () => {
      const tooFar = validateAdvanceWindow("2026-10-02", today); // 8 days
      expect(tooFar.isValid).toBe(false);
      expect(tooFar.error).toMatch(/rolling 7-day advance window/i);
    });
  });

  describe("Availability Grid", () => {
    it("returns all active courts with their slots for a valid date", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const grid = getAvailabilityGrid("venue-padel-prime", todayStr);

      expect(grid.venueName).toBe("Padel Prime Club");
      expect(grid.date).toBe(todayStr);
      expect(grid.courts.length).toBe(4);

      // Verify each court has slots configured
      for (const courtAvailability of grid.courts) {
        expect(courtAvailability.slots.length).toBeGreaterThan(0);
        for (const slot of courtAvailability.slots) {
          expect(slot.courtType).toBe(courtAvailability.court.type);
          expect(slot.price).toBeGreaterThan(0);
          expect(["open", "held", "booked", "blocked"]).toContain(slot.status);
        }
      }
    });

    it("throws an error when querying outside the 7-day window", () => {
      expect(() => getAvailabilityGrid("venue-padel-prime", "2020-01-01")).toThrow(/past/i);
    });
  });

  describe("Staff Slot Blocking & Unblocking", () => {
    it("allows staff to block an open slot with a reason", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slots = db.getScheduleSlots(todayStr);
      const targetSlot = slots[0];

      const blocked = blockSlot(targetSlot.id, "Court Glass Maintenance");
      expect(blocked.status).toBe("blocked");
      expect(blocked.blockReason).toBe("Court Glass Maintenance");

      // Verify in grid
      const grid = getAvailabilityGrid("venue-padel-prime", todayStr);
      const updatedSlot = grid.courts
        .flatMap((c) => c.slots)
        .find((s) => s.id === targetSlot.id);
      expect(updatedSlot?.status).toBe("blocked");
    });

    it("allows staff to unblock a blocked slot", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slots = db.getScheduleSlots(todayStr);
      const targetSlot = slots[0];

      blockSlot(targetSlot.id, "Emergency check");
      const unblocked = unblockSlot(targetSlot.id);
      expect(unblocked.status).toBe("open");
      expect(unblocked.blockReason).toBeNull();
    });

    it("prevents blocking a slot that is already booked", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slots = db.getScheduleSlots(todayStr);
      const targetSlot = slots[0];

      db.updateSlotStatus(targetSlot.id, "booked");
      expect(() => blockSlot(targetSlot.id, "Maintenance")).toThrow(/already been booked/i);
    });
  });
});
