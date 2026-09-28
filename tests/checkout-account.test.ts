import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { accountForRequest, ownsHold, createPaymentTransaction } = vi.hoisted(() => ({
  accountForRequest: vi.fn(),
  ownsHold: vi.fn(),
  createPaymentTransaction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ accountForRequest, ownsHold }));
vi.mock("@/lib/payments", () => ({ createPaymentTransaction }));

import { POST } from "@/app/api/checkout/initiate/route";

describe("checkout account identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ownsHold.mockReturnValue(true);
    accountForRequest.mockReturnValue({
      id: "account-1",
      name: "Nama Akun",
      email: "akun@example.com",
      phone: "+6281234567890",
    });
    createPaymentTransaction.mockResolvedValue({ orderId: "PAY-1" });
  });

  it("uses the signed-in account even when the request includes other contact details", async () => {
    const request = new NextRequest("http://localhost/api/checkout/initiate", {
      method: "POST",
      body: JSON.stringify({
        holdId: "hold-1",
        paymentMethod: "QRIS",
        customerName: "Nama Lain",
        customerEmail: "lain@example.com",
        customerPhone: "+6289999999999",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(createPaymentTransaction).toHaveBeenCalledWith({
      holdId: "hold-1",
      paymentMethod: "QRIS",
      customerName: "Nama Akun",
      customerEmail: "akun@example.com",
      customerPhone: "+6281234567890",
    });
  });

  it("requires a saved WhatsApp number", async () => {
    accountForRequest.mockReturnValue({ id: "account-1", name: "Nama Akun", email: "akun@example.com" });
    const request = new NextRequest("http://localhost/api/checkout/initiate", {
      method: "POST",
      body: JSON.stringify({ holdId: "hold-1", paymentMethod: "QRIS" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(createPaymentTransaction).not.toHaveBeenCalled();
  });
});
