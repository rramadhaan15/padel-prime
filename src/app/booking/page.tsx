import BookingDashboardPage from "@/components/prime/booking-page";
import { bookingDays } from "@/lib/booking-display";
import { currentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; type?: string }>;
}) {
  const account = await currentAccount();
  if (!account) {
    const { date, type } = await searchParams;
    const next = new URLSearchParams();
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) next.set("date", date);
    if (type === "Indoor" || type === "Outdoor") next.set("type", type);
    const destination = `/booking${next.size ? `?${next}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }
  return <BookingDashboardPage days={bookingDays()} account={account} />;
}
