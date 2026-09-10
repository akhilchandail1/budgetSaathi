"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { DEMO_EMAIL } from "@/lib/demo.constants";
import { db } from "@/db";
import { actionPriorityValues, financeActions } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.email === DEMO_EMAIL) throw new Error("The demo account is read-only.");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/actions");
}

const financeActionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  priority: z.enum(actionPriorityValues),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional(),
});

export type FinanceActionState = { error: string | null };

export async function createFinanceAction(input: unknown): Promise<FinanceActionState> {
  const userId = await requireUserId();
  const parsed = financeActionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db.insert(financeActions).values({
    userId,
    title: parsed.data.title,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate || null,
    notes: parsed.data.notes || null,
  });
  revalidateAll();
  return { error: null };
}

export async function updateFinanceAction(id: string, input: unknown): Promise<FinanceActionState> {
  const userId = await requireUserId();
  const parsed = financeActionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db
    .update(financeActions)
    .set({
      title: parsed.data.title,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(financeActions.id, id), eq(financeActions.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function toggleFinanceAction(id: string, completed: boolean): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(financeActions)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(financeActions.id, id), eq(financeActions.userId, userId)));
  revalidateAll();
}

export async function deleteFinanceAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(financeActions).where(and(eq(financeActions.id, id), eq(financeActions.userId, userId)));
  revalidateAll();
}
