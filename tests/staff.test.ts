import { describe, it, expect, beforeEach } from "vitest";
import {
  validateStaffPin,
  getDailyOccupancyStats,
  getEquipmentStagingSummary,
  createWalkInBooking,
} from "@/lib/staff";
import { blockSlot, unblockSlot } from "@/lib/scheduling";
import { db } from "@/lib/db";

describe("Staff Dashboard, Walk-in & Slot Blocking (Ticket 08)", () => {
  beforeEach(() => {
    db.reset();
  });

  describe("Staff Authentication", () => {
    it("validates staff PIN correctly", () => {
      expect(validateStaffPin("padel888")).toBe(true);
      expect(validateStaffPin("wrongpin")).toBe(false);
    });
  });

  describe("Daily Occupancy & Revenue Metrics", () => {
    it("calculates accurate occupancy statistics and revenue for a date", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const stats = getDailyOccupancyStats(todayStr);

      expect(stats.totalSlots).toBeGreaterThan(0);
      expect(stats.openSlots).toBe(stats.totalSlots);
      expect(stats.bookedSlots).toBe(0);
      expect(stats.occupancyRatePercent).toBe(0);
      expect(stats.totalEstimatedRevenue).toBe(0);

      // Book 1 slot via walk-in
      const slot = db.getScheduleSlots(todayStr)[0];
      createWalkInBooking({
        slotId: slot.id,
        customerName: "Walk-in Guest",
        customerPhone: "08123456789",
      });

      const updatedStats = getDailyOccupancyStats(todayStr);
      expect(updatedStats.bookedSlots).toBe(1);
      expect(updatedStats.openSlots).toBe(stats.totalSlots - 1);
      expect(updatedStats.totalEstimatedRevenue).toBe(slot.price);
      expect(updatedStats.occupancyRatePercent).toBeGreaterThan(0);
    });
  });

  describe("Equipment Staging Summary", () => {
    it("aggregates rackets and balls to be staged at the front desk", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[0];

      createWalkInBooking({
        slotId: slot.id,
        customerName: "Tournament Player",
        customerPhone: "081299991111",
        racketsCount: 3,
        ballsCount: 2,
      });

      const staging = getEquipmentStagingSummary(todayStr);
      expect(staging.totalRacketsToStage).toBe(3);
      expect(staging.totalBallsToStage).toBe(2);
      expect(staging.items.length).toBe(1);
      expect(staging.items[0].customerName).toBe("Tournament Player");
    });
  });

  describe("Manual Walk-in Bookings & Slot Blocking", () => {
    it("creates walk-in reservation immediately confirmed", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[1];

      const booking = createWalkInBooking({
        slotId: slot.id,
        customerName: "Ahmad Dani",
        customerPhone: "08133334444",
        racketsCount: 2,
        ballsCount: 0,
      });

      expect(booking.status).toBe("Confirmed");
      expect(booking.paymentMethod).toBe("WALK_IN");
      expect(booking.bookingRef).toMatch(/^BK-WALKIN-/);
      expect(booking.customerPhone).toBe("+628133334444");

      // Slot must be booked
      expect(db.getScheduleSlot(slot.id)?.status).toBe("booked");
    });

    it("allows staff to block and unblock slots", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[2];

      const blocked = blockSlot(slot.id, "Court Surface Resurfacing");
      expect(blocked.status).toBe("blocked");
      expect(blocked.blockReason).toBe("Court Surface Resurfacing");

      const stats = getDailyOccupancyStats(todayStr);
      expect(stats.blockedSlots).toBe(1);

      const unblocked = unblockSlot(slot.id);
      expect(unblocked.status).toBe("open");
      expect(unblocked.blockReason).toBeNull();
    });
  });
});
