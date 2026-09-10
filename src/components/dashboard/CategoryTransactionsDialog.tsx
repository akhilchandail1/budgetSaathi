"use client";

import { createElement, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { deleteTransaction } from "@/app/actions/transactions";
import { getTransactionsForCategory } from "@/lib/selectors";
import type { Category, Transaction } from "@/lib/types";
import { formatDateLabel, formatINR } from "@/lib/format";
import { getCategoryIcon } from "@/lib/icons";

export function CategoryTransactionsDialog({
  category,
  transactions,
  onClose,
}: {
  category: Category | null;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const rows = category ? getTransactionsForCategory(transactions, category.id) : [];
  const icon = category
    ? createElement(getCategoryIcon(category.icon), { className: "h-4 w-4" })
    : null;

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
      router.refresh();
    });
  }

  return (
    <Dialog open={category !== null} onOpenChange={(v) => !v && onClose()}>
      {category && (
        <DialogContent title={category.name}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              {icon && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  {icon}
                </span>
              )}
              {rows.length} transaction{rows.length === 1 ? "" : "s"} logged
            </div>

            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                No transactions logged for this category yet.
              </p>
            ) : (
              <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
                {rows.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-800">{t.note || "—"}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDateLabel(t.date)} · {t.paymentMode}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium tabular-nums text-zinc-900">
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
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
