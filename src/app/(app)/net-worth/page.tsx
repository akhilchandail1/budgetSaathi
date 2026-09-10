import { auth } from "@/auth";
import { getNetWorthItems, getNetWorthSnapshots } from "@/db/queries";
import { NetWorthClient } from "@/components/networth/NetWorthClient";

export default async function NetWorthPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [items, snapshots] = await Promise.all([
    getNetWorthItems(userId),
    getNetWorthSnapshots(userId),
  ]);

  return <NetWorthClient items={items} snapshots={snapshots} />;
}
