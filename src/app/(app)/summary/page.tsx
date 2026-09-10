import { auth } from "@/auth";
import { getCategories, getTransactions } from "@/db/queries";
import { SummaryClient } from "@/components/summary/SummaryClient";

export default async function SummaryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    getTransactions(userId),
  ]);

  return <SummaryClient categories={categories} transactions={transactions} />;
}
