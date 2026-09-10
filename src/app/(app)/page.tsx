import { auth } from "@/auth";
import { getCategories, getCategoryBudgets, getTransactions } from "@/db/queries";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, transactions, categoryBudgets] = await Promise.all([
    getCategories(userId),
    getTransactions(userId),
    getCategoryBudgets(userId),
  ]);

  return (
    <DashboardClient
      categories={categories}
      transactions={transactions}
      categoryBudgets={categoryBudgets}
    />
  );
}
