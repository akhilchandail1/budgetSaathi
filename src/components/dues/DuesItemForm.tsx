"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDue, updateDue } from "@/app/actions/dues";
import type { BillingCycle, DuesCategory, DuesItem } from "@/lib/dues";

export function DuesItemForm({
  item,
  category,
  trigger,
}: {
  item?: DuesItem;
  category: DuesCategory;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [cycle, setCycle] = useState<BillingCycle>(item?.cycle ?? "monthly");
  const [nextDueDate, setNextDueDate] = useState(item?.nextDueDate ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(item?.name ?? "");
    setAmount(item ? String(item.amount) : "");
    setCycle(item?.cycle ?? "monthly");
    setNextDueDate(item?.nextDueDate ?? "");
    setNotes(item?.notes ?? "");
    setError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    const input = {
      category,
      name: name.trim(),
      amount: parsedAmount,
      cycle,
      nextDueDate: nextDueDate || undefined,
      notes: notes.trim() || undefined,
    };
    startTransition(async () => {
      const result = item ? await updateDue(item.id, input) : await createDue(input);
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={item ? "Edit Due" : "New Due"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spotify" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Amount (₹)</label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Billing Cycle</label>
              <Select value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Next Due Date (optional)</label>
            <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Family plan, auto-pay card" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Due"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
