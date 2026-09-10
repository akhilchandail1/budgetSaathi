"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createFinanceAction, updateFinanceAction } from "@/app/actions/financeActions";
import { ACTION_PRIORITIES, type ActionPriority, type FinanceAction } from "@/lib/financeActions";

export function FinanceActionForm({
  item,
  trigger,
}: {
  item?: FinanceAction;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [priority, setPriority] = useState<ActionPriority>(item?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle(item?.title ?? "");
    setPriority(item?.priority ?? "medium");
    setDueDate(item?.dueDate ?? "");
    setNotes(item?.notes ?? "");
    setError(null);
  }

  function handleSave() {
    if (!title.trim()) {
      setError("Enter a title");
      return;
    }
    const input = {
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    };
    startTransition(async () => {
      const result = item ? await updateFinanceAction(item.id, input) : await createFinanceAction(input);
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
      <DialogContent title={item ? "Edit Action" : "New Finance Action"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Renew car insurance" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Priority</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as ActionPriority)}>
                {ACTION_PRIORITIES.map((p) => (
                  <option key={p.priority} value={p.priority}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Due Date (optional)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Policy number, agent contact" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Action"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
