import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizePhoneNumber,
  createPaymentTransaction,
  processPaymentWebhook,
  generateGatewaySignature,
  verifyGatewaySignature,
} from "@/lib/payments";
import { acquireSlotHold } from "@/lib/holds";
import { bindAddonsToHold } from "@/lib/equipment";
import { db } from "@/lib/db";
import { resetRedisMemoryStore } from "@/lib/redis";

describe("Guest Checkout & Payment Gateway (Ticket 04)", () => {
  beforeEach(() => {
    db.reset();
    resetRedisMemoryStore();
  });

  describe("E.164 Phone Normalization", () => {
    it("normalizes Indonesian phone formats to E.164", () => {
      expect(normalizePhoneNumber("081234567890")).toBe("+6281234567890");
      expect(normalizePhoneNumber("6281234567890")).toBe("+6281234567890");
      expect(normalizePhoneNumber("+6281234567890")).toBe("+6281234567890");
      expect(normalizePhoneNumber("0812-3456-7890")).toBe("+6281234567890");
    });

    it("throws on invalid or empty phone numbers", () => {
      expect(() => normalizePhoneNumber("")).toThrow();
      expect(() => normalizePhoneNumber("+1")).toThrow(/format/i);
    });
  });

  describe("Transaction Creation & Webhook Processing", () => {
    it("creates payment transaction with QRIS and confirms booking via webhook", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[0];

      const holdResult = await acquireSlotHold({ slotId: slot.id });
      bindAddonsToHold(holdResult.holdId, 2, 1);

      const txn = await createPaymentTransaction({
        holdId: holdResult.holdId,
        customerName: "Rizki Ramadhan",
        customerEmail: "rizki@example.com",
        customerPhone: "08123456789",
        paymentMethod: "QRIS",
      });

      expect(txn.orderId).toBe(`PAY-${holdResult.holdId}`);
      expect(txn.paymentDetails.qrisString).toBeDefined();
      expect(txn.totalAmount).toBe(slot.price + 2 * 50000 + 1 * 120000);

      // Verify webhook signature generation & validation
      const signature = generateGatewaySignature(txn.orderId, "200", txn.totalAmount);
      expect(verifyGatewaySignature(txn.orderId, "200", txn.totalAmount, signature)).toBe(true);

      // Process webhook settlement
      const { booking, isDuplicate } = await processPaymentWebhook({
        orderId: txn.orderId,
        statusCode: "200",
        grossAmount: txn.totalAmount,
        transactionStatus: "settlement",
        signature,
      });

      expect(isDuplicate).toBe(false);
      expect(booking.status).toBe("Confirmed");
      expect(booking.customerName).toBe("Rizki Ramadhan");
      expect(booking.customerPhone).toBe("+628123456789");
      expect(booking.bookingRef).toMatch(/^BK-/);
      expect(booking.qrSignature).toBeDefined();

      // Slot should now be marked booked
      expect(db.getScheduleSlot(slot.id)?.status).toBe("booked");
      // Hold should be marked converted
      expect(db.getSlotHold(holdResult.holdId)?.status).toBe("converted");
    });

    it("idempotently handles duplicate webhooks without double-booking", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[1];

      const holdResult = await acquireSlotHold({ slotId: slot.id });
      const txn = await createPaymentTransaction({
        holdId: holdResult.holdId,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        customerPhone: "08198765432",
        paymentMethod: "VA_BCA",
      });

      const signature = generateGatewaySignature(txn.orderId, "200", txn.totalAmount);

      // 1st webhook
      const first = await processPaymentWebhook({
        orderId: txn.orderId,
        statusCode: "200",
        grossAmount: txn.totalAmount,
        transactionStatus: "settlement",
        signature,
      });
      expect(first.isDuplicate).toBe(false);

      // 2nd webhook (duplicate)
      const second = await processPaymentWebhook({
        orderId: txn.orderId,
        statusCode: "200",
        grossAmount: txn.totalAmount,
        transactionStatus: "settlement",
        signature,
      });
      expect(second.isDuplicate).toBe(true);
      expect(second.booking.id).toBe(first.booking.id);
    });

    it("rejects webhook when cryptographic signature does not match", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[2];

      const holdResult = await acquireSlotHold({ slotId: slot.id });
      const txn = await createPaymentTransaction({
        holdId: holdResult.holdId,
        customerName: "Alice",
        customerEmail: "alice@example.com",
        customerPhone: "08122334455",
        paymentMethod: "QRIS",
      });

      const fakeSignature = "invalid_tampered_signature_hex_value";

      await expect(
        processPaymentWebhook({
          orderId: txn.orderId,
          statusCode: "200",
          grossAmount: txn.totalAmount,
          transactionStatus: "settlement",
          signature: fakeSignature,
        })
      ).rejects.toThrow(/signature/i);
    });
  });
});
