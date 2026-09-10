import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCategories, getTransactions } from "@/db/queries";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [categories, transactions] = await Promise.all([
    getCategories(session.user.id),
    getTransactions(session.user.id),
  ]);

  return (
    <AppShell
      categories={categories}
      transactions={transactions}
      userEmail={session.user.email}
    >
      {children}
    </AppShell>
  );
}
