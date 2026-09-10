import type { Category, CategoryBudget, MonthKey, Transaction } from "./types";
import { monthKeyFromISO } from "./format";

export interface CategoryMonthRow {
  category: Category;
  actual: number;
  budget: number | null;
  isCustomBudget: boolean; // true when budget comes from a per-month override, not the category default
  difference: number | null; // budget - actual, expense/investment categories only
  percentSpent: number | null; // actual / budget * 100, expense/investment categories only
}

export interface MonthSummary {
  expenseRows: CategoryMonthRow[];
  incomeRows: CategoryMonthRow[];
  investmentRows: CategoryMonthRow[];
  totalExpense: number;
  totalIncome: number;
  totalInvestment: number;
  totalBudget: number;
  totalInvestmentBudget: number;
  net: number;
}

export function buildMonthSummary(
  categories: Category[],
  transactions: Transaction[],
  month: MonthKey,
  categoryBudgets: CategoryBudget[] = []
): MonthSummary {
  const actualByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (monthKeyFromISO(t.date) !== month) continue;
    actualByCategory.set(t.categoryId, (actualByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  const overrideByCategory = new Map<string, number>();
  for (const b of categoryBudgets) {
    if (b.month === month) overrideByCategory.set(b.categoryId, b.amount);
  }

  const buildRow = (category: Category): CategoryMonthRow => {
    const actual = actualByCategory.get(category.id) ?? 0;
    const hasBudget = category.type === "expense" || category.type === "investment";
    const override = overrideByCategory.get(category.id);
    const budget = !hasBudget ? null : override ?? category.monthlyBudget;
    return {
      category,
      actual,
      budget,
      isCustomBudget: hasBudget && override != null,
      difference: budget != null ? budget - actual : null,
      percentSpent: budget != null ? (budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0) : null,
    };
  };

  const active = categories.filter((c) => !c.archived);
  const expenseRows = active.filter((c) => c.type === "expense").map(buildRow);
  const incomeRows = active.filter((c) => c.type === "income").map(buildRow);
  const investmentRows = active.filter((c) => c.type === "investment").map(buildRow);

  const totalExpense = expenseRows.reduce((sum, r) => sum + r.actual, 0);
  const totalIncome = incomeRows.reduce((sum, r) => sum + r.actual, 0);
  const totalInvestment = investmentRows.reduce((sum, r) => sum + r.actual, 0);
  const totalBudget = expenseRows.reduce((sum, r) => sum + (r.budget ?? 0), 0);
  const totalInvestmentBudget = investmentRows.reduce((sum, r) => sum + (r.budget ?? 0), 0);

  return {
    expenseRows,
    incomeRows,
    investmentRows,
    totalExpense,
    totalIncome,
    totalInvestment,
    totalBudget,
    totalInvestmentBudget,
    net: totalIncome - totalExpense,
  };
}

export interface PeriodTotals {
  period: string;
  income: number;
  expense: number;
  investment: number;
}

/** Buckets transactions into arbitrary periods (week/month/year) by a caller-supplied key function. */
export function buildPeriodTotals(
  transactions: Transaction[],
  categories: Category[],
  periods: string[],
  periodKeyFromISO: (iso: string) => string
): PeriodTotals[] {
  const typeByCategory = new Map(categories.map((c) => [c.id, c.type]));
  const totals = new Map<string, { income: number; expense: number; investment: number }>(
    periods.map((p) => [p, { income: 0, expense: 0, investment: 0 }])
  );

  for (const t of transactions) {
    const bucket = totals.get(periodKeyFromISO(t.date));
    if (!bucket) continue;
    const type = typeByCategory.get(t.categoryId);
    if (type === "income") bucket.income += t.amount;
    else if (type === "investment") bucket.investment += t.amount;
    else bucket.expense += t.amount;
  }

  return periods.map((period) => ({ period, ...totals.get(period)! }));
}

export interface DaySummary {
  date: string; // ISO
  totalExpense: number;
  totalIncome: number;
  totalInvestment: number;
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
      totalInvestment: 0,
      transactionCount: 0,
    };
    const type = typeByCategory.get(t.categoryId);
    if (type === "income") entry.totalIncome += t.amount;
    else if (type === "investment") entry.totalInvestment += t.amount;
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
