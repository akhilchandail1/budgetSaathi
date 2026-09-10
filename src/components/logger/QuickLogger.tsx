"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CategoryCombobox } from "./CategoryCombobox";
import { addTransaction } from "@/app/actions/transactions";
import { evaluateAmount } from "@/lib/calc";
import { getTodayISO } from "@/lib/format";
import { PAYMENT_MODES, type Category, type PaymentMode } from "@/lib/types";
import { cn } from "@/lib/utils";

function defaultCategory(categories: Category[], preferredId?: string) {
  if (preferredId) return preferredId;
  return categories.find((c) => c.type === "expense" && !c.archived)?.id ?? categories[0]?.id ?? "";
}

export function QuickLogger({
  categories,
  defaultCategoryId,
  trigger,
}: {
  categories: Category[];
  defaultCategoryId?: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [categoryId, setCategoryId] = useState(() => defaultCategory(categories, defaultCategoryId));
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [error, setError] = useState<string | null>(null);

  const resolvedAmount = evaluateAmount(amountInput);
  const showsMath = /[+\-*/()]/.test(amountInput);

  function reset() {
    setAmountInput("");
    setCategoryId(defaultCategory(categories, defaultCategoryId));
    setDate(getTodayISO());
    setNote("");
    setPaymentMode("UPI");
    setError(null);
  }

  function handleSave() {
    if (resolvedAmount === null || resolvedAmount <= 0) {
      setError("Enter a valid amount, e.g. 150 or 150+300");
      return;
    }
    if (!categoryId) {
      setError("Pick a category");
      return;
    }
    startTransition(async () => {
      const result = await addTransaction({
        date,
        categoryId,
        amount: resolvedAmount,
        note: note.trim() || undefined,
        paymentMode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
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
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="rounded-full shadow-lg">
            <Plus className="h-5 w-5" />
            Log Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title="Log Transaction">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Amount (₹)</label>
            <Input
              inputMode="decimal"
              autoFocus
              placeholder="e.g. 150 or 45+120"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setError(null);
              }}
              className="text-lg font-medium"
            />
            {showsMath && (
              <p className={cn("mt-1 text-xs", resolvedAmount !== null ? "text-emerald-600" : "text-zinc-400")}>
                {resolvedAmount !== null ? `= ₹${resolvedAmount.toLocaleString("en-IN")}` : "Keep typing…"}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
            <CategoryCombobox categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Payment Mode</label>
              <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Note (optional)</label>
            <Input
              placeholder="e.g. Dinner with friends"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button size="lg" onClick={handleSave} disabled={isPending} className="mt-1">
            {isPending ? "Saving…" : "Save Transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
