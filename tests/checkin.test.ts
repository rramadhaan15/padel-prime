import { describe, it, expect, beforeEach } from "vitest";
import { verifyAndCheckIn, searchBookings, runNoShowSweep } from "@/lib/checkin";
import { createTicketQrToken } from "@/lib/tickets";
import { db } from "@/lib/db";

describe("On-Site QR Check-in & Automated No-Show Lifecycle (Ticket 09)", () => {
  beforeEach(() => {
    db.reset();
  });

  describe("QR Check-in & Duplicate Prevention", () => {
    it("successfully checks in a customer using a valid signed QR token", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[0];

      const booking = db.createBooking({
        id: "bk-checkin-1",
        bookingRef: "BK-20260924-CHK1",
        slotId: slot.id,
        courtId: slot.courtId,
        customerName: "Rizki Ramadhan",
        customerEmail: "rizki@test.com",
        customerPhone: "+628123456789",
        racketsCount: 2,
        ballsCount: 1,
        slotPrice: slot.price,
        addonsPrice: 220000,
        totalAmount: slot.price + 220000,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig123",
        createdAt: new Date(),
      });

      const qrToken = createTicketQrToken({
        bookingRef: booking.bookingRef,
        slotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        customerName: booking.customerName,
        issuedAt: Date.now(),
      });

      const result = await verifyAndCheckIn(qrToken);

      expect(result.booking.status).toBe("Checked-In");
      expect(result.booking.checkedInAt).toBeDefined();
      expect(result.customer?.phone).toBe("+628123456789");
    });

    it("strictly rejects duplicate check-in attempts", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[1];

      const booking = db.createBooking({
        id: "bk-checkin-dup",
        bookingRef: "BK-20260924-DUP",
        slotId: slot.id,
        courtId: slot.courtId,
        customerName: "Duplicate Tester",
        customerEmail: "dup@test.com",
        customerPhone: "+6281233334444",
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: slot.price,
        addonsPrice: 0,
        totalAmount: slot.price,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig_dup",
        createdAt: new Date(),
      });

      // 1st Check-in
      await verifyAndCheckIn(booking.bookingRef);

      // 2nd Check-in (duplicate) must fail
      await expect(verifyAndCheckIn(booking.bookingRef)).rejects.toThrow(/ALREADY been checked-in/i);
    });

    it("rejects check-in for a ticket that was rescheduled", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[2];

      const booking = db.createBooking({
        id: "bk-checkin-rescheduled",
        bookingRef: "BK-20260924-RESCHED",
        slotId: slot.id,
        courtId: slot.courtId,
        customerName: "Rescheduled Player",
        customerEmail: "resched@test.com",
        customerPhone: "+6281255556666",
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: slot.price,
        addonsPrice: 0,
        totalAmount: slot.price,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Rescheduled",
        qrSignature: "sig_resched",
        createdAt: new Date(),
      });

      await expect(verifyAndCheckIn(booking.bookingRef)).rejects.toThrow(/rescheduled/i);
    });
  });

  describe("Customer Booking Search", () => {
    it("searches bookings by phone, customer name, and reference", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const slot = db.getScheduleSlots(todayStr)[3];

      db.createBooking({
        id: "bk-search-test",
        bookingRef: "BK-SEARCH-TARGET",
        slotId: slot.id,
        courtId: slot.courtId,
        customerName: "Fajar Alfian",
        customerEmail: "fajar@test.com",
        customerPhone: "+6281987654321",
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: slot.price,
        addonsPrice: 0,
        totalAmount: slot.price,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig_search",
        createdAt: new Date(),
      });

      // Search by phone
      expect(searchBookings("987654321").length).toBe(1);
      // Search by name
      expect(searchBookings("Fajar").length).toBe(1);
      // Search by ref
      expect(searchBookings("SEARCH-TARGET").length).toBe(1);
      // Non-matching query
      expect(searchBookings("UnknownPerson").length).toBe(0);
    });
  });

  describe("Automated No-Show Sweep & Customer Flagging", () => {
    it("automatically transitions expired unchecked bookings to No-Show and flags customers at 3 strikes", () => {
      const pastDateStr = "2026-09-23";
      // Manually create a slot in the past with end time 09:00
      const pastSlot = db.createSlot({
        id: "slot-past-noshow-1",
        courtId: "court-1",
        date: pastDateStr,
        startTime: "07:30",
        endTime: "09:00",
        timeBand: "Regular",
        price: 250000,
        status: "booked",
      });

      const customerPhone = "+628177778888";

      // Create a confirmed booking that never checked in
      db.createBooking({
        id: "bk-noshow-1",
        bookingRef: "BK-NOSHOW-1",
        slotId: pastSlot.id,
        courtId: pastSlot.courtId,
        customerName: "Habitual NoShow",
        customerEmail: "noshow@test.com",
        customerPhone,
        racketsCount: 0,
        ballsCount: 0,
        slotPrice: 250000,
        addonsPrice: 0,
        totalAmount: 250000,
        paymentMethod: "QRIS",
        paymentStatus: "settled",
        status: "Confirmed",
        qrSignature: "sig_ns1",
        createdAt: new Date(),
      });

      // Pre-seed customer with 2 existing no-shows
      db.incrementCustomerNoShow(customerPhone);
      db.incrementCustomerNoShow(customerPhone);
      expect(db.getCustomer(customerPhone)?.noShowCount).toBe(2);
      expect(db.getCustomer(customerPhone)?.isFlagged).toBe(false);

      // Run No-Show Sweep with current time after slot end time
      const refTime = new Date(`${pastDateStr}T10:00:00`);
      const sweep = runNoShowSweep(refTime);

      expect(sweep.transitionedCount).toBe(1);
      expect(sweep.noShowBookings[0].status).toBe("No-Show");

      // Customer should now have 3 no-shows and be FLAGGED
      const updatedCustomer = db.getCustomer(customerPhone);
      expect(updatedCustomer?.noShowCount).toBe(3);
      expect(updatedCustomer?.isFlagged).toBe(true);
      expect(sweep.flaggedCustomers.length).toBe(1);
    });
  });
});
