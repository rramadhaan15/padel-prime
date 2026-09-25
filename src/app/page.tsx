import LandingPage from "@/components/prime/landing-page";
import { bookingDays } from "@/lib/booking-display";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <LandingPage days={bookingDays()} />;
}
