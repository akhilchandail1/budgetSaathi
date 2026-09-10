"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setCategoryBudgetForMonth } from "@/app/actions/categoryBudgets";
import { formatINR, formatMonthLabel } from "@/lib/format";
import type { Category, MonthKey } from "@/lib/types";

export function CategoryBudgetDialog({
  category,
  month,
  budget,
  isCustomBudget,
  trigger,
}: {
  category: Category;
  month: MonthKey;
  budget: number | null;
  isCustomBudget: boolean;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(budget != null ? String(budget) : "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAmount(budget != null ? String(budget) : "");
    setError(null);
  }

  function save(value: number | null) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setError("Enter a valid budget amount");
      return;
    }
    startTransition(async () => {
      const result = await setCategoryBudgetForMonth({
        categoryId: category.id,
        month,
        amount: value,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleSave() {
    save(amount.trim() ? parseFloat(amount) : null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={`Budget for ${formatMonthLabel(month)}`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500">{category.name}</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Budget for this month (₹)
            </label>
            <Input
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="Optional"
            />
            <p className="mt-1 text-xs text-zinc-400">
              {isCustomBudget
                ? `Overrides the default of ${category.monthlyBudget != null ? formatINR(category.monthlyBudget) : "no budget"}/mo.`
                : "Only changes this month — the category's default budget stays the same."}
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {isCustomBudget && (
              <Button variant="outline" onClick={() => save(null)} disabled={isPending} className="flex-1">
                Reset to default
              </Button>
            )}
            <Button onClick={handleSave} disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
