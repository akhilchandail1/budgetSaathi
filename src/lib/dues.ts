export type DuesCategory = "subscription" | "insurance" | "credit_card" | "other";
export type BillingCycle = "monthly" | "yearly";

export interface DuesItem {
  id: string;
  category: DuesCategory;
  name: string;
  amount: number;
  cycle: BillingCycle;
  nextDueDate: string | null; // ISO date
  notes: string | null;
}

export interface DuesCategoryMeta {
  category: DuesCategory;
  label: string;
  icon: string;
}

export const DUES_CATEGORIES: DuesCategoryMeta[] = [
  { category: "subscription", label: "Subscriptions", icon: "Repeat" },
  { category: "insurance", label: "Insurance", icon: "ShieldCheck" },
  { category: "credit_card", label: "Credit Card Dues", icon: "CreditCard" },
  { category: "other", label: "Other Recurring Costs", icon: "Receipt" },
];

export function getDuesCategoryMeta(category: DuesCategory): DuesCategoryMeta {
  return DUES_CATEGORIES.find((c) => c.category === category) ?? DUES_CATEGORIES[0];
}

export function monthlyEquivalent(item: DuesItem): number {
  return item.cycle === "yearly" ? item.amount / 12 : item.amount;
}

export interface DuesTotals {
  totalMonthly: number;
  totalYearly: number;
  count: number;
}

export function computeDuesTotals(items: DuesItem[]): DuesTotals {
  const totalMonthly = items.reduce((sum, i) => sum + monthlyEquivalent(i), 0);
  return { totalMonthly, totalYearly: totalMonthly * 12, count: items.length };
}

export function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type DueUrgency = "overdue" | "soon" | "normal" | "none";

export function getDueUrgency(item: DuesItem): DueUrgency {
  if (!item.nextDueDate) return "none";
  const days = daysUntil(item.nextDueDate);
  if (days < 0) return "overdue";
  if (days <= 7) return "soon";
  return "normal";
}

export function sortByDueDate(items: DuesItem[]): DuesItem[] {
  return items.slice().sort((a, b) => {
    if (!a.nextDueDate && !b.nextDueDate) return a.name.localeCompare(b.name);
    if (!a.nextDueDate) return 1;
    if (!b.nextDueDate) return -1;
    return a.nextDueDate.localeCompare(b.nextDueDate);
  });
}
