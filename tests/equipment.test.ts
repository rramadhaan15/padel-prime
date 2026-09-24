import { describe, it, expect, beforeEach } from "vitest";
import { bindAddonsToHold, getAvailableEquipment, MAX_RACKETS_PER_SLOT } from "@/lib/equipment";
import { acquireSlotHold } from "@/lib/holds";
import { db } from "@/lib/db";
import { resetRedisMemoryStore } from "@/lib/redis";

describe("Equipment Pool & Add-ons (Ticket 03)", () => {
  beforeEach(() => {
    db.reset();
    resetRedisMemoryStore();
  });

  it("successfully binds racket rentals and ball purchases to an active hold", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const slot = slots[0];

    const holdResult = await acquireSlotHold({ slotId: slot.id });
    const bindResult = bindAddonsToHold(holdResult.holdId, 2, 1);

    expect(bindResult.hold.racketsCount).toBe(2);
    expect(bindResult.hold.ballsCount).toBe(1);

    expect(bindResult.pricing.racketsPrice).toBe(2 * 50000);
    expect(bindResult.pricing.ballsPrice).toBe(1 * 120000);
    expect(bindResult.pricing.addonsTotal).toBe(220000);
    expect(bindResult.pricing.grandTotal).toBe(slot.price + 220000);

    // Verify equipment pool stock decreased
    const stock = getAvailableEquipment(slot.date, slot.startTime);
    expect(stock.availableRackets).toBe(stock.totalRackets - 2);
    expect(stock.availableBalls).toBe(stock.totalBalls - 1);
  });

  it("strictly enforces maximum 4 rackets per slot", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const slot = slots[1];

    const holdResult = await acquireSlotHold({ slotId: slot.id });

    // Selecting 5 rackets should throw
    expect(() => bindAddonsToHold(holdResult.holdId, 5, 0)).toThrow(/maximum of 4 rackets/i);
    // Negative racket count should throw
    expect(() => bindAddonsToHold(holdResult.holdId, -1, 0)).toThrow(/maximum of 4 rackets/i);
  });

  it("prevents overselling when equipment pool stock is exhausted", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const slot1 = slots[0];

    // Simulate depleted stock by manually setting rentedRackets close to max
    const pool = db.getEquipmentStock(slot1.date, slot1.startTime);
    pool.rentedRackets = pool.totalRackets - 2; // only 2 left

    const holdResult = await acquireSlotHold({ slotId: slot1.id });

    // Requesting 3 rackets when only 2 remain must fail
    expect(() => bindAddonsToHold(holdResult.holdId, 3, 0)).toThrow(/insufficient racket stock/i);

    // Requesting 2 rackets should succeed
    const success = bindAddonsToHold(holdResult.holdId, 2, 0);
    expect(success.hold.racketsCount).toBe(2);
  });

  it("rejects binding add-ons to an expired or nonexistent hold", () => {
    expect(() => bindAddonsToHold("non-existent-hold-id", 2, 1)).toThrow(/not found/i);
  });
});
