import LandingPage from "@/components/prime/landing-page";
import { bookingDays } from "@/lib/booking-display";
import { currentAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <LandingPage days={bookingDays()} account={await currentAccount()} />;
}
