import type { Category, MonthKey, Transaction } from "./types";
import { monthKeyFromISO } from "./format";

export interface CategoryMonthRow {
  category: Category;
  actual: number;
  budget: number | null;
  difference: number | null; // budget - actual, expense categories only
  percentSpent: number | null; // actual / budget * 100, expense categories only
}

export interface MonthSummary {
  expenseRows: CategoryMonthRow[];
  incomeRows: CategoryMonthRow[];
  totalExpense: number;
  totalIncome: number;
  totalBudget: number;
  net: number;
}

export function buildMonthSummary(
  categories: Category[],
  transactions: Transaction[],
  month: MonthKey
): MonthSummary {
  const actualByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (monthKeyFromISO(t.date) !== month) continue;
    actualByCategory.set(t.categoryId, (actualByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  const buildRow = (category: Category): CategoryMonthRow => {
    const actual = actualByCategory.get(category.id) ?? 0;
    const budget = category.type === "expense" ? category.monthlyBudget : null;
    return {
      category,
      actual,
      budget,
      difference: budget != null ? budget - actual : null,
      percentSpent: budget != null ? (budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0) : null,
    };
  };

  const active = categories.filter((c) => !c.archived);
  const expenseRows = active.filter((c) => c.type === "expense").map(buildRow);
  const incomeRows = active.filter((c) => c.type === "income").map(buildRow);

  const totalExpense = expenseRows.reduce((sum, r) => sum + r.actual, 0);
  const totalIncome = incomeRows.reduce((sum, r) => sum + r.actual, 0);
  const totalBudget = expenseRows.reduce((sum, r) => sum + (r.budget ?? 0), 0);

  return {
    expenseRows,
    incomeRows,
    totalExpense,
    totalIncome,
    totalBudget,
    net: totalIncome - totalExpense,
  };
}

export interface PeriodTotals {
  period: string;
  income: number;
  expense: number;
}

/** Buckets transactions into arbitrary periods (week/month/year) by a caller-supplied key function. */
export function buildPeriodTotals(
  transactions: Transaction[],
  categories: Category[],
  periods: string[],
  periodKeyFromISO: (iso: string) => string
): PeriodTotals[] {
  const typeByCategory = new Map(categories.map((c) => [c.id, c.type]));
  const totals = new Map<string, { income: number; expense: number }>(
    periods.map((p) => [p, { income: 0, expense: 0 }])
  );

  for (const t of transactions) {
    const bucket = totals.get(periodKeyFromISO(t.date));
    if (!bucket) continue;
    if (typeByCategory.get(t.categoryId) === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return periods.map((period) => ({ period, ...totals.get(period)! }));
}

export interface DaySummary {
  date: string; // ISO
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
}

/** Groups a month's transactions by date, for the calendar view. */
export function buildCalendarSummary(
  transactions: Transaction[],
  categories: Category[],
  month: MonthKey
): Map<string, DaySummary> {
  const typeByCategory = new Map(categories.map((c) => [c.id, c.type]));
  const byDate = new Map<string, DaySummary>();

  for (const t of transactions) {
    if (monthKeyFromISO(t.date) !== month) continue;
    const entry = byDate.get(t.date) ?? {
      date: t.date,
      totalExpense: 0,
      totalIncome: 0,
      transactionCount: 0,
    };
    if (typeByCategory.get(t.categoryId) === "income") entry.totalIncome += t.amount;
    else entry.totalExpense += t.amount;
    entry.transactionCount += 1;
    byDate.set(t.date, entry);
  }

  return byDate;
}

export function getTransactionsForCategory(
  transactions: Transaction[],
  categoryId: string
): Transaction[] {
  return transactions
    .filter((t) => t.categoryId === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
