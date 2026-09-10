import { auth } from "@/auth";
import { getCoupons } from "@/db/queries";
import { CouponsClient } from "@/components/coupons/CouponsClient";

export default async function CouponsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const items = await getCoupons(userId);

  return <CouponsClient items={items} />;
}
