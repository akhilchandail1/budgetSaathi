"use client";

import { createElement, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { deleteTransaction } from "@/app/actions/transactions";
import { getCategoryIcon } from "@/lib/icons";
import { formatDateLabel, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

export function DayTransactionsDialog({
  date,
  transactions,
  categories,
  onClose,
}: {
  date: string | null;
  transactions: Transaction[];
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const rows = date
    ? transactions.filter((t) => t.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
      router.refresh();
    });
  }

  return (
    <Dialog open={date !== null} onOpenChange={(v) => !v && onClose()}>
      {date && (
        <DialogContent title={formatDateLabel(date)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-500">
              {rows.length} transaction{rows.length === 1 ? "" : "s"} logged
            </p>

            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No transactions on this day.</p>
            ) : (
              <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
                {rows.map((t) => {
                  const category = categoryById.get(t.categoryId);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                          {category && createElement(getCategoryIcon(category.icon), { className: "h-4 w-4" })}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-800">{category?.name ?? "—"}</p>
                          <p className="truncate text-xs text-zinc-400">{t.note || t.paymentMode}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            category?.type === "income" ? "text-emerald-600" : "text-zinc-900"
                          )}
                        >
                          {category?.type === "income" ? "+" : "−"}
                          {formatINR(t.amount)}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(t.id)}
                          title="Delete transaction"
                          className="rounded-md p-1.5 text-zinc-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
