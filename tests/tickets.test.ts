import { describe, it, expect, beforeEach } from "vitest";
import { createTicketQrToken, verifyTicketQrToken, generateQrCodeDataUrl } from "@/lib/tickets";
import {
  dispatchBookingConfirmations,
  getWhatsAppLog,
  getEmailLog,
  clearNotificationLogs,
} from "@/lib/notifications";
import { db } from "@/lib/db";

describe("Digital Ticket & Dual-Channel Dispatch (Ticket 06)", () => {
  beforeEach(() => {
    db.reset();
    clearNotificationLogs();
  });

  describe("Cryptographic QR Token Signing & Tamper Verification", () => {
    const payload = {
      bookingRef: "BK-20260924-TEST",
      slotId: "slot-court-1-2026-09-24-0730",
      date: "2026-09-24",
      startTime: "07:30",
      customerName: "Rizki Ramadhan",
      issuedAt: 1774435200000,
    };

    it("creates a signed QR token and successfully verifies it", () => {
      const token = createTicketQrToken(payload);
      expect(token).toContain(".");

      const verification = verifyTicketQrToken(token);
      expect(verification.isValid).toBe(true);
      expect(verification.payload?.bookingRef).toBe("BK-20260924-TEST");
      expect(verification.payload?.customerName).toBe("Rizki Ramadhan");
    });

    it("strictly rejects tampered or forged QR tokens", () => {
      const token = createTicketQrToken(payload);
      const [encodedPayload, signature] = token.split(".");

      // Tamper with the payload (e.g. altering the customer name or booking ref)
      const decodedJson = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
      decodedJson.customerName = "Hacker / Impersonator";
      const tamperedEncoded = Buffer.from(JSON.stringify(decodedJson)).toString("base64url");

      const tamperedToken = `${tamperedEncoded}.${signature}`;
      const result = verifyTicketQrToken(tamperedToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/signature mismatch|altered|forged/i);
    });

    it("generates a scannable data URL for the QR code", async () => {
      const token = createTicketQrToken(payload);
      const dataUrl = await generateQrCodeDataUrl(token);

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("Dual-Channel Dispatch (WhatsApp & Email)", () => {
    it("dispatches both WhatsApp confirmation and official Email invoice", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[0];

      const booking = db.createBooking({
        id: "bk-test-dispatch-1",
        bookingRef: "BK-20260924-DISPATCH",
        slotId: slot.id,
        courtId: slot.courtId,
        customerName: "Siti Rahma",
        customerEmail: "siti@example.com",
        customerPhone: "+6281299990000",
        racketsCount: 2,
        ballsCount: 1,
        slotPrice: slot.price,
        addonsPrice: 220000,
        totalAmount: slot.price + 220000,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "test_sig",
        createdAt: new Date(),
      });

      const { whatsapp, email } = await dispatchBookingConfirmations(booking.id);

      expect(whatsapp.phone).toBe("+6281299990000");
      expect(whatsapp.message).toContain(booking.bookingRef);
      expect(whatsapp.message).toContain("tiket digital");

      expect(email.email).toBe("siti@example.com");
      expect(email.subject).toContain(booking.bookingRef);
      expect(email.totalAmount).toBe(booking.totalAmount);

      expect(getWhatsAppLog().length).toBe(1);
      expect(getEmailLog().length).toBe(1);
    });
  });
});
