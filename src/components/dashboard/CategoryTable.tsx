"use client";

import { Plus } from "lucide-react";
import type { CategoryMonthRow } from "@/lib/selectors";
import type { Category } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { getCategoryIcon } from "@/lib/icons";
import { Progress } from "@/components/ui/progress";
import { QuickLogger } from "@/components/logger/QuickLogger";

export function CategoryTable({
  rows,
  type,
  categories,
  onCategoryClick,
}: {
  rows: CategoryMonthRow[];
  type: "income" | "expense" | "investment";
  categories: Category[];
  onCategoryClick: (categoryId: string) => void;
}) {
  const hasBudgetColumns = type === "expense" || type === "investment";

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-10 text-center text-sm text-zinc-400">
        No {type} categories yet. Add one from Settings.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
            <th className="px-4 py-3 font-medium">Category</th>
            {hasBudgetColumns && <th className="px-4 py-3 text-right font-medium">Budget (₹)</th>}
            <th className="px-4 py-3 text-right font-medium">Actual (₹)</th>
            {hasBudgetColumns && <th className="px-4 py-3 font-medium">% Used</th>}
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const Icon = getCategoryIcon(row.category.icon);
            return (
              <tr
                key={row.category.id}
                onClick={() => onCategoryClick(row.category.id)}
                className="cursor-pointer border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50"
              >
                <td className="px-4 py-2.5 text-zinc-800">
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    {row.category.name}
                  </span>
                </td>
                {hasBudgetColumns && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                    {row.budget != null ? formatINR(row.budget) : "—"}
                  </td>
                )}
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">
                  {formatINR(row.actual)}
                </td>
                {hasBudgetColumns && (
                  <td className="px-4 py-2.5">
                    {row.percentSpent != null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={row.percentSpent} className="w-24" />
                        <span className="w-10 text-xs tabular-nums text-zinc-400">
                          {Math.round(row.percentSpent)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">No budget set</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <QuickLogger
                    categories={categories}
                    defaultCategoryId={row.category.id}
                    trigger={
                      <button
                        title={`Log ${row.category.name}`}
                        className="rounded-md p-1.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
