import { describe, it, expect, beforeEach } from "vitest";
import { acquireSlotHold, releaseSlotHold, getHoldStatus, SlotConflictError } from "@/lib/holds";
import { db } from "@/lib/db";
import { resetRedisMemoryStore } from "@/lib/redis";

describe("Pessimistic Slot Hold & Concurrency Control (Ticket 02)", () => {
  beforeEach(() => {
    db.reset();
    resetRedisMemoryStore();
  });

  it("successfully acquires a 10-minute hold on an open slot", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const targetSlot = slots[0];

    const result = await acquireSlotHold({ slotId: targetSlot.id });

    expect(result.holdId).toBeDefined();
    expect(result.slotId).toBe(targetSlot.id);
    expect(result.ttlSeconds).toBe(600); // 10 minutes

    // Slot status must be transitioned to "held"
    const updatedSlot = db.getScheduleSlot(targetSlot.id);
    expect(updatedSlot?.status).toBe("held");

    // Hold status check
    const status = getHoldStatus(result.holdId);
    expect(status.isValid).toBe(true);
    expect(status.remainingSeconds).toBeGreaterThan(590);
    expect(status.slot?.id).toBe(targetSlot.id);
  });

  it("guarantees mutual exclusion under parallel concurrent requests (Promise.all)", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const targetSlot = slots[1];

    // Fire 5 concurrent hold requests simultaneously for the exact same slot
    const attempts = Array.from({ length: 5 }).map((_, i) =>
      acquireSlotHold({
        slotId: targetSlot.id,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@test.com`,
      })
        .then((res) => ({ success: true as const, res, err: null }))
        .catch((err: unknown) => ({ success: false as const, res: null, err }))
    );

    const results = await Promise.all(attempts);

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    // EXACTLY 1 request must succeed
    expect(successes.length).toBe(1);
    // The other 4 MUST be rejected
    expect(failures.length).toBe(4);

    for (const fail of failures) {
      expect(fail.err).toBeInstanceOf(SlotConflictError);
    }
  });

  it("releases hold and restores slot to open", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const targetSlot = slots[2];

    const hold = await acquireSlotHold({ slotId: targetSlot.id });
    expect(db.getScheduleSlot(targetSlot.id)?.status).toBe("held");

    const released = await releaseSlotHold(hold.holdId);
    expect(released).toBe(true);

    expect(db.getScheduleSlot(targetSlot.id)?.status).toBe("open");
    const statusAfter = getHoldStatus(hold.holdId);
    expect(statusAfter.isValid).toBe(false);
  });

  it("prevents acquiring a hold on a slot that is already booked", async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const slots = db.getScheduleSlots(todayStr);
    const targetSlot = slots[3];

    db.updateSlotStatus(targetSlot.id, "booked");

    await expect(acquireSlotHold({ slotId: targetSlot.id })).rejects.toThrow(SlotConflictError);
  });
});
