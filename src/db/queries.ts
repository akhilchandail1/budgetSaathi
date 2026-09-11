import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  categories,
  categoryBudgets,
  coupons,
  dues,
  financeActions,
  financialGoals,
  netWorthItems,
  netWorthSnapshots,
  transactions,
} from "@/db/schema";
import type { Category, CategoryBudget, PaymentMode, Transaction } from "@/lib/types";
import type { NetWorthItem, NetWorthItemType, NetWorthSnapshot } from "@/lib/netWorth";
import type { BillingCycle, DuesCategory, DuesItem } from "@/lib/dues";
import type { CouponItem, CouponType, CouponValueType } from "@/lib/coupons";
import type { ActionPriority, FinanceAction } from "@/lib/financeActions";
import type { FinancialGoal, GoalStatus } from "@/lib/goals";

export function toCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    monthlyBudget: row.monthlyBudget != null ? Number(row.monthlyBudget) : null,
    archived: row.archived,
  };
}

function toTransaction(row: typeof transactions.$inferSelect): Transaction {
  return {
    id: row.id,
    date: row.date,
    categoryId: row.categoryId,
    amount: Number(row.amount),
    note: row.note,
    paymentMode: row.paymentMode as PaymentMode,
    createdAt: row.createdAt.toISOString(),
  };
}

export const getCategories = cache(async (userId: string): Promise<Category[]> => {
  const rows = await db.select().from(categories).where(eq(categories.userId, userId));
  return rows.map(toCategory).sort((a, b) => a.name.localeCompare(b.name));
});

export const getTransactions = cache(async (userId: string): Promise<Transaction[]> => {
  const rows = await db.select().from(transactions).where(eq(transactions.userId, userId));
  return rows.map(toTransaction).sort((a, b) => b.date.localeCompare(a.date));
});

function toCategoryBudget(row: typeof categoryBudgets.$inferSelect): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.categoryId,
    month: row.month,
    amount: Number(row.amount),
  };
}

export const getCategoryBudgets = cache(async (userId: string): Promise<CategoryBudget[]> => {
  const rows = await db.select().from(categoryBudgets).where(eq(categoryBudgets.userId, userId));
  return rows.map(toCategoryBudget);
});

export async function categoryHasTransactions(userId: string, categoryId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.categoryId, categoryId)))
    .limit(1);
  return Boolean(row);
}

function toNetWorthItem(row: typeof netWorthItems.$inferSelect): NetWorthItem {
  return {
    id: row.id,
    type: row.type as NetWorthItemType,
    name: row.name,
    amount: Number(row.amount),
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const getNetWorthItems = cache(async (userId: string): Promise<NetWorthItem[]> => {
  const rows = await db.select().from(netWorthItems).where(eq(netWorthItems.userId, userId));
  return rows.map(toNetWorthItem).sort((a, b) => a.name.localeCompare(b.name));
});

export const getNetWorthSnapshots = cache(async (userId: string): Promise<NetWorthSnapshot[]> => {
  const rows = await db
    .select()
    .from(netWorthSnapshots)
    .where(eq(netWorthSnapshots.userId, userId))
    .orderBy(asc(netWorthSnapshots.month));
  return rows.map((row) => ({
    month: row.month,
    netWorth: Number(row.netWorth),
    breakdown: row.breakdown,
  }));
});

function toDuesItem(row: typeof dues.$inferSelect): DuesItem {
  return {
    id: row.id,
    category: row.category as DuesCategory,
    name: row.name,
    amount: Number(row.amount),
    cycle: row.cycle as BillingCycle,
    nextDueDate: row.nextDueDate,
    notes: row.notes,
  };
}

export const getDues = cache(async (userId: string): Promise<DuesItem[]> => {
  const rows = await db.select().from(dues).where(eq(dues.userId, userId));
  return rows.map(toDuesItem);
});

function toCouponItem(row: typeof coupons.$inferSelect): CouponItem {
  return {
    id: row.id,
    type: row.type as CouponType,
    merchant: row.merchant,
    title: row.title,
    code: row.code,
    value: Number(row.value),
    valueType: row.valueType as CouponValueType,
    expiryDate: row.expiryDate,
    notes: row.notes,
  };
}

export const getCoupons = cache(async (userId: string): Promise<CouponItem[]> => {
  const rows = await db.select().from(coupons).where(eq(coupons.userId, userId));
  return rows.map(toCouponItem);
});

function toFinanceAction(row: typeof financeActions.$inferSelect): FinanceAction {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    priority: row.priority as ActionPriority,
    dueDate: row.dueDate,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export const getFinanceActions = cache(async (userId: string): Promise<FinanceAction[]> => {
  const rows = await db.select().from(financeActions).where(eq(financeActions.userId, userId));
  return rows.map(toFinanceAction);
});

function toFinancialGoal(row: typeof financialGoals.$inferSelect): FinancialGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.targetAmount),
    currentAmount: Number(row.currentAmount),
    targetDate: row.targetDate,
    notes: row.notes,
    status: row.status as GoalStatus,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export const getFinancialGoals = cache(async (userId: string): Promise<FinancialGoal[]> => {
  const rows = await db.select().from(financialGoals).where(eq(financialGoals.userId, userId));
  return rows.map(toFinancialGoal);
});
