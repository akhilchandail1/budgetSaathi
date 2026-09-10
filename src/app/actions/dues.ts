"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { billingCycleValues, dues, duesCategoryValues } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/dues");
}

const duesSchema = z.object({
  category: z.enum(duesCategoryValues),
  name: z.string().trim().min(1, "Name is required").max(80),
  amount: z.number().positive(),
  cycle: z.enum(billingCycleValues),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional(),
});

export type DuesActionState = { error: string | null };

export async function createDue(input: unknown): Promise<DuesActionState> {
  const userId = await requireUserId();
  const parsed = duesSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db.insert(dues).values({
    userId,
    category: parsed.data.category,
    name: parsed.data.name,
    amount: String(parsed.data.amount),
    cycle: parsed.data.cycle,
    nextDueDate: parsed.data.nextDueDate || null,
    notes: parsed.data.notes || null,
  });
  revalidateAll();
  return { error: null };
}

export async function updateDue(id: string, input: unknown): Promise<DuesActionState> {
  const userId = await requireUserId();
  const parsed = duesSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db
    .update(dues)
    .set({
      category: parsed.data.category,
      name: parsed.data.name,
      amount: String(parsed.data.amount),
      cycle: parsed.data.cycle,
      nextDueDate: parsed.data.nextDueDate || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(dues.id, id), eq(dues.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function deleteDue(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(dues).where(and(eq(dues.id, id), eq(dues.userId, userId)));
  revalidateAll();
}
