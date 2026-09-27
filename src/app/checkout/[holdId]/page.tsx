import CheckoutPage from "@/components/prime/checkout-page";
import { currentAccount } from "@/lib/auth";
import { getHoldStatus } from "@/lib/holds";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProtectedCheckoutPage({
  params,
}: {
  params: Promise<{ holdId: string }>;
}) {
  const account = await currentAccount();
  if (!account) redirect("/login?next=%2Fbooking");
  const { holdId } = await params;
  const hold = getHoldStatus(holdId).hold;
  if (!hold || hold.customerId !== account.id) notFound();
  return <CheckoutPage params={params} />;
}
