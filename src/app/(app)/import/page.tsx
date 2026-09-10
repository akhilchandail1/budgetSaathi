import { auth } from "@/auth";
import { getCategories, getTransactions } from "@/db/queries";
import { ImportClient } from "@/components/import/ImportClient";

export default async function ImportPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    getTransactions(userId),
  ]);

  return <ImportClient categories={categories} transactions={transactions} />;
}
