export type ActionPriority = "low" | "medium" | "high";

export interface FinanceAction {
  id: string;
  title: string;
  notes: string | null;
  priority: ActionPriority;
  dueDate: string | null; // ISO date
  completed: boolean;
  completedAt: string | null; // ISO datetime
}

export interface ActionPriorityMeta {
  priority: ActionPriority;
  label: string;
}

export const ACTION_PRIORITIES: ActionPriorityMeta[] = [
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
];

export function getActionPriorityMeta(priority: ActionPriority): ActionPriorityMeta {
  return ACTION_PRIORITIES.find((p) => p.priority === priority) ?? ACTION_PRIORITIES[1];
}

export function isActionOverdue(action: FinanceAction): boolean {
  if (action.completed || !action.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(action.dueDate + "T00:00:00") < today;
}

const PRIORITY_RANK: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 };

export function sortActions(items: FinanceAction[]): FinanceAction[] {
  return items.slice().sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const overdueDiff = Number(isActionOverdue(b)) - Number(isActionOverdue(a));
    if (overdueDiff !== 0) return overdueDiff;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}
