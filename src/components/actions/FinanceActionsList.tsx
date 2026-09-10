"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinanceActionForm } from "./FinanceActionForm";
import { deleteFinanceAction, toggleFinanceAction } from "@/app/actions/financeActions";
import { formatDateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getActionPriorityMeta, isActionOverdue, sortActions, type FinanceAction } from "@/lib/financeActions";

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

function ActionRow({ action }: { action: FinanceAction }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const overdue = isActionOverdue(action);
  const priorityMeta = getActionPriorityMeta(action.priority);

  function handleToggle() {
    startTransition(async () => {
      await toggleFinanceAction(action.id, !action.completed);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this action?")) return;
    startTransition(async () => {
      await deleteFinanceAction(action.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2">
      <div className="flex min-w-0 items-start gap-3">
        <button
          disabled={isPending}
          onClick={handleToggle}
          aria-label={action.completed ? "Mark as not done" : "Mark as done"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
            action.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 hover:border-zinc-400"
          )}
        >
          {action.completed && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0">
          <p className={cn("truncate text-sm", action.completed ? "text-zinc-400 line-through" : "text-zinc-800")}>
            {action.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={PRIORITY_TONE[action.priority]}>{priorityMeta.label}</Badge>
            {action.dueDate && (
              <span className={cn("text-xs", overdue ? "font-medium text-red-600" : "text-zinc-400")}>
                {overdue ? "Overdue · " : "Due "}
                {formatDateLabel(action.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <FinanceActionForm
          item={action}
          trigger={
            <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <Pencil className="h-4 w-4" />
            </button>
          }
        />
        <button
          disabled={isPending}
          onClick={handleDelete}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FinanceActionsList({ items }: { items: FinanceAction[] }) {
  const sorted = sortActions(items);
  const pendingCount = items.filter((a) => !a.completed).length;
  const overdueCount = items.filter(isActionOverdue).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-900">Finance To-Dos</CardTitle>
          <p className="mt-0.5 text-xs text-zinc-400">
            {pendingCount} open{overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
          </p>
        </div>
        <FinanceActionForm
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        {sorted.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">No finance actions yet.</p>}
        {sorted.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
      </CardContent>
    </Card>
  );
}
