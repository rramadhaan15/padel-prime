import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { currentAccount, redirect, listBookings, getScheduleSlot, getCourt } = vi.hoisted(() => ({
  currentAccount: vi.fn(),
  redirect: vi.fn((destination: string) => { throw new Error(`redirect:${destination}`); }),
  listBookings: vi.fn(),
  getScheduleSlot: vi.fn(),
  getCourt: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ currentAccount }));
vi.mock("@/lib/db", () => ({ db: { listBookings, getScheduleSlot, getCourt } }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/components/prime/site-shell", () => ({ SiteHeader: () => null, SiteFooter: () => null }));

import OrdersPage from "@/app/pesanan/page";

describe("booking saya", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T03:00:00Z"));
    currentAccount.mockResolvedValue({ id: "account-1", name: "Rizki", email: "rizki@example.com" });
    getCourt.mockReturnValue({ id: "court-1", name: "Grand Arena", type: "Indoor" });
    getScheduleSlot.mockImplementation((id: string) => ({
      id,
      date: id === "future" ? "2026-09-30" : "2026-09-28",
      startTime: "09:00",
      endTime: "10:30",
    }));
  });

  afterEach(() => vi.useRealTimers());

  it("requires a session", async () => {
    currentAccount.mockResolvedValue(null);
    await expect(OrdersPage()).rejects.toThrow("redirect:/login?next=%2Fpesanan");
  });

  it("shows only this account's upcoming and past bookings", async () => {
    listBookings.mockReturnValue([
      { id: "own-future", bookingRef: "BK-FUTURE", customerEmail: "RIZKI@example.com", slotId: "future", courtId: "court-1", status: "Confirmed", totalAmount: 350000, racketsCount: 1, ballsCount: 0 },
      { id: "own-past", bookingRef: "BK-PAST", customerEmail: "rizki@example.com", slotId: "past", courtId: "court-1", status: "Checked-In", totalAmount: 350000, racketsCount: 0, ballsCount: 0 },
      { id: "other", bookingRef: "BK-OTHER", customerEmail: "other@example.com", slotId: "future", courtId: "court-1", status: "Confirmed", totalAmount: 350000, racketsCount: 0, ballsCount: 0 },
    ]);

    const html = renderToStaticMarkup(await OrdersPage());

    expect(html).toContain("BK-FUTURE");
    expect(html).toContain("BK-PAST");
    expect(html).not.toContain("BK-OTHER");
    expect(html).toContain('href="/ticket/own-future"');
    expect(html).toContain("Akan datang");
    expect(html).toContain("Riwayat booking");
    expect(html.indexOf("BK-FUTURE")).toBeLessThan(html.indexOf("Riwayat booking"));
    expect(html.indexOf("BK-PAST")).toBeGreaterThan(html.indexOf("Riwayat booking"));
  });
});
