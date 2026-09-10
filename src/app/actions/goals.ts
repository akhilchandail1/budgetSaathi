"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { DEMO_EMAIL } from "@/lib/demo.constants";
import { db } from "@/db";
import { financialGoals } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.email === DEMO_EMAIL) throw new Error("The demo account is read-only.");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/actions");
}

const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional(),
});

export type GoalActionState = { error: string | null };

export async function createGoal(input: unknown): Promise<GoalActionState> {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db.insert(financialGoals).values({
    userId,
    name: parsed.data.name,
    targetAmount: String(parsed.data.targetAmount),
    currentAmount: String(parsed.data.currentAmount ?? 0),
    targetDate: parsed.data.targetDate || null,
    notes: parsed.data.notes || null,
  });
  revalidateAll();
  return { error: null };
}

export async function updateGoal(id: string, input: unknown): Promise<GoalActionState> {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db
    .update(financialGoals)
    .set({
      name: parsed.data.name,
      targetAmount: String(parsed.data.targetAmount),
      ...(parsed.data.currentAmount != null ? { currentAmount: String(parsed.data.currentAmount) } : {}),
      targetDate: parsed.data.targetDate || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function addGoalContribution(id: string, amount: number): Promise<GoalActionState> {
  if (!Number.isFinite(amount) || amount === 0) return { error: "Enter a valid amount" };
  const userId = await requireUserId();

  await db
    .update(financialGoals)
    .set({
      currentAmount: sql`greatest(0, ${financialGoals.currentAmount} + ${String(amount)})`,
      updatedAt: new Date(),
    })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function completeGoal(id: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(financialGoals)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));
  revalidateAll();
}

export async function reopenGoal(id: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(financialGoals)
    .set({ status: "active", completedAt: null, updatedAt: new Date() })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));
  revalidateAll();
}

export async function deleteGoal(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(financialGoals).where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));
  revalidateAll();
}
