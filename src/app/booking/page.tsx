import BookingDashboardPage from "@/components/prime/booking-page";
import { bookingDays } from "@/lib/booking-display";

export const dynamic = "force-dynamic";

export default function BookingPage() {
  return <BookingDashboardPage days={bookingDays()} />;
}
