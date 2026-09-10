"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNetWorthItem, updateNetWorthItem } from "@/app/actions/netWorth";
import type { NetWorthItem, NetWorthItemType } from "@/lib/netWorth";

export function NetWorthItemForm({
  item,
  type,
  trigger,
}: {
  item?: NetWorthItem;
  type: NetWorthItemType;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(item?.name ?? "");
    setAmount(item ? String(item.amount) : "");
    setNotes(item?.notes ?? "");
    setError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Enter a name");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Enter a valid amount");
      return;
    }
    const input = { type, name: name.trim(), amount: parsedAmount, notes: notes.trim() || undefined };
    startTransition(async () => {
      const result = item
        ? await updateNetWorthItem(item.id, input)
        : await createNetWorthItem(input);
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
      <DialogContent title={item ? "Edit Entry" : "New Entry"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Flexicap SIP" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Amount (₹)</label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Current value"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Folio number, bank" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
