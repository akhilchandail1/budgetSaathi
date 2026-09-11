"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ICON_OPTIONS } from "@/lib/icons";
import { createCategory, updateCategory } from "@/app/actions/categories";
import type { Category, CategoryType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryForm({
  category,
  defaultType,
  trigger,
  onCreated,
}: {
  category?: Category;
  defaultType: CategoryType;
  trigger: React.ReactNode;
  onCreated?: (category: Category) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<CategoryType>(category?.type ?? defaultType);
  const [icon, setIcon] = useState(category?.icon ?? ICON_OPTIONS[0].name);
  const [budget, setBudget] = useState(
    category?.monthlyBudget != null ? String(category.monthlyBudget) : ""
  );
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(category?.name ?? "");
    setType(category?.type ?? defaultType);
    setIcon(category?.icon ?? ICON_OPTIONS[0].name);
    setBudget(category?.monthlyBudget != null ? String(category.monthlyBudget) : "");
    setError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Enter a category name");
      return;
    }
    const parsedBudget = budget.trim() ? parseFloat(budget) : null;
    if (budget.trim() && (!Number.isFinite(parsedBudget) || (parsedBudget as number) < 0)) {
      setError("Enter a valid monthly budget");
      return;
    }
    const input = {
      name: name.trim(),
      type,
      icon,
      monthlyBudget: type === "expense" || type === "investment" ? parsedBudget : null,
    };
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, input)
        : await createCategory(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      if (!category && result.category) onCreated?.(result.category);
      router.refresh();
    });
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
      <DialogContent title={category ? "Edit Category" : "New Category"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
              <Select value={type} onChange={(e) => setType(e.target.value as CategoryType)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="investment">Investment</option>
              </Select>
            </div>
            {(type === "expense" || type === "investment") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Monthly Budget (₹)
                </label>
                <Input
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Icon</label>
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
              {ICON_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = icon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIcon(opt.name)}
                    title={opt.name}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
