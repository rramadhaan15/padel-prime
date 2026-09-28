import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { currentAccount, redirect } = vi.hoisted(() => ({
  currentAccount: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("@/lib/auth", () => ({ currentAccount }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("@/components/prime/site-shell", () => ({ SiteHeader: () => null, SiteFooter: () => null }));
vi.mock("@/components/prime/logout-button", () => ({ LogoutButton: () => null }));

import ProfilePage from "@/app/profil/page";

describe("profil akun", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an active account session", async () => {
    currentAccount.mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow("redirect:/login?next=%2Fprofil");
    expect(redirect).toHaveBeenCalledWith("/login?next=%2Fprofil");
  });

  it("shows only the signed-in account details", async () => {
    currentAccount.mockResolvedValue({
      id: "account-1",
      name: "Rizki",
      email: "rizki@example.com",
      phone: "+6281234567890",
      passwordHash: "private-hash",
    });

    const html = renderToStaticMarkup(await ProfilePage());

    expect(html).toContain("Rizki");
    expect(html).toContain("rizki@example.com");
    expect(html).toContain("+6281234567890");
    expect(html).not.toContain("private-hash");
  });
});
