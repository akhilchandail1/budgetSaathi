"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGoal, updateGoal } from "@/app/actions/goals";
import type { FinancialGoal } from "@/lib/goals";

export function GoalForm({ item, trigger }: { item?: FinancialGoal; trigger: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(item ? String(item.targetAmount) : "");
  const [currentAmount, setCurrentAmount] = useState(item ? String(item.currentAmount) : "0");
  const [targetDate, setTargetDate] = useState(item?.targetDate ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(item?.name ?? "");
    setTargetAmount(item ? String(item.targetAmount) : "");
    setCurrentAmount(item ? String(item.currentAmount) : "0");
    setTargetDate(item?.targetDate ?? "");
    setNotes(item?.notes ?? "");
    setError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    const parsedTarget = parseFloat(targetAmount);
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Enter a valid target amount");
      return;
    }
    const parsedCurrent = currentAmount.trim() === "" ? 0 : parseFloat(currentAmount);
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      setError("Enter a valid saved amount");
      return;
    }
    const input = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined,
    };
    startTransition(async () => {
      const result = item ? await updateGoal(item.id, input) : await createGoal(input);
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
      <DialogContent title={item ? "Edit Goal" : "New Financial Goal"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Goal Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Target Amount (₹)</label>
              <Input inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Already Saved (₹)</label>
              <Input inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Target Date (optional)</label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 6 months of expenses" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
