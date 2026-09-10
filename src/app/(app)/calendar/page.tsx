import { auth } from "@/auth";
import { getCategories, getTransactions } from "@/db/queries";
import { CalendarClient } from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    getTransactions(userId),
  ]);

  return <CalendarClient categories={categories} transactions={transactions} />;
}
