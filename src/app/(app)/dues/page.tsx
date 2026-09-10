import { auth } from "@/auth";
import { getDues } from "@/db/queries";
import { DuesClient } from "@/components/dues/DuesClient";

export default async function DuesPage() {
  const session = await auth();
  const userId = session!.user.id;
  const items = await getDues(userId);

  return <DuesClient items={items} />;
}
