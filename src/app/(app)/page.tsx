import { auth } from "@/auth";
import { getCategories, getTransactions } from "@/db/queries";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    getTransactions(userId),
  ]);

  return <DashboardClient categories={categories} transactions={transactions} />;
}
