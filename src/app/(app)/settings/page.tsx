import { auth } from "@/auth";
import { getCategories } from "@/db/queries";
import { CategoryManager } from "@/components/settings/CategoryManager";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const categories = await getCategories(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">
          Manage your income, expense, and investment categories, icons, and monthly budgets.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
