"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { GoalForm } from "./GoalForm";
import { addGoalContribution, completeGoal, deleteGoal, reopenGoal } from "@/app/actions/goals";
import { formatDateLabel, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { goalProgressPct, goalRemaining, isGoalAchieved, type FinancialGoal } from "@/lib/goals";

export function GoalCard({ goal }: { goal: FinancialGoal }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contribution, setContribution] = useState("");
  const pct = goalProgressPct(goal);
  const achieved = isGoalAchieved(goal);
  const isCompleted = goal.status === "completed";

  function handleAddFunds() {
    const amount = parseFloat(contribution);
    if (!Number.isFinite(amount) || amount === 0) return;
    startTransition(async () => {
      await addGoalContribution(goal.id, amount);
      setContribution("");
      router.refresh();
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeGoal(goal.id);
      router.refresh();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenGoal(goal.id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this goal?")) return;
    startTransition(async () => {
      await deleteGoal(goal.id);
      router.refresh();
    });
  }

  return (
    <Card className={cn(isCompleted && "opacity-70")}>
      <CardHeader className="flex-row items-start justify-between">
        <div className="min-w-0">
          <CardTitle className={cn("text-sm font-semibold", isCompleted ? "text-zinc-400 line-through" : "text-zinc-900")}>
            {goal.name}
          </CardTitle>
          {goal.targetDate && (
            <p className="mt-0.5 text-xs text-zinc-400">Target: {formatDateLabel(goal.targetDate)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GoalForm
            item={goal}
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
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold tabular-nums text-zinc-900">{formatINR(goal.currentAmount)}</span>
            <span className="text-zinc-400">of {formatINR(goal.targetAmount)}</span>
          </div>
          <Progress value={pct} />
          <p className="mt-1 text-xs text-zinc-400">
            {achieved ? "Target reached" : `${formatINR(goalRemaining(goal))} to go · ${pct}%`}
          </p>
        </div>

        {isCompleted ? (
          <Button variant="outline" size="sm" onClick={handleReopen} disabled={isPending}>
            <RotateCcw className="h-4 w-4" /> Reopen Goal
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                inputMode="decimal"
                placeholder="Add amount (₹)"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="h-9"
              />
              <Button size="sm" variant="outline" onClick={handleAddFunds} disabled={isPending || !contribution}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleComplete} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
