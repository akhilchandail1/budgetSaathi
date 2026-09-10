"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./CategoryForm";
import { deleteCategory } from "@/app/actions/categories";
import { getCategoryIcon } from "@/lib/icons";
import { formatINR } from "@/lib/format";
import type { Category, CategoryType } from "@/lib/types";

function CategorySection({
  title,
  type,
  categories,
}: {
  title: string;
  type: CategoryType;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const rows = categories.filter((c) => c.type === type && !c.archived);

  function handleDelete(category: Category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.archived) {
        window.alert(
          `"${category.name}" has logged transactions, so it was archived instead of deleted — it's hidden from new entries but its transaction history is kept.`
        );
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-zinc-900">{title}</CardTitle>
        <CategoryForm
          defaultType={type}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400">No categories yet.</p>
        )}
        {rows.map((category) => {
          const Icon = getCategoryIcon(category.icon);
          return (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-zinc-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  <Icon className="h-4 w-4" />
                </span>
                {category.name}
                {type === "expense" && category.monthlyBudget != null && (
                  <span className="text-xs text-zinc-400">· {formatINR(category.monthlyBudget)}/mo</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <CategoryForm
                  category={category}
                  defaultType={type}
                  trigger={
                    <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                />
                <button
                  disabled={isPending}
                  onClick={() => handleDelete(category)}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CategorySection title="Expense Categories" type="expense" categories={categories} />
      <CategorySection title="Income Categories" type="income" categories={categories} />
    </div>
  );
}
