export type GoalStatus = "active" | "completed";

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null; // ISO date
  notes: string | null;
  status: GoalStatus;
  completedAt: string | null; // ISO datetime
}

export function goalProgressPct(goal: FinancialGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

export function goalRemaining(goal: FinancialGoal): number {
  return Math.max(0, goal.targetAmount - goal.currentAmount);
}

export function isGoalAchieved(goal: FinancialGoal): boolean {
  return goal.currentAmount >= goal.targetAmount;
}

export function sortGoals(items: FinancialGoal[]): FinancialGoal[] {
  return items.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate);
    }
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;
    return a.name.localeCompare(b.name);
  });
}
