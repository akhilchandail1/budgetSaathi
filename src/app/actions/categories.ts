"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { categoryHasTransactions } from "@/db/queries";
import { categories, categoryTypeValues } from "@/db/schema";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  type: z.enum(categoryTypeValues),
  icon: z.string().trim().min(1),
  monthlyBudget: z.number().nonnegative().nullable(),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/summary");
}

export type CategoryActionState = { error: string | null };

export async function createCategory(input: unknown): Promise<CategoryActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };

  await db.insert(categories).values({
    userId,
    name: parsed.data.name,
    type: parsed.data.type,
    icon: parsed.data.icon,
    monthlyBudget: parsed.data.monthlyBudget != null ? String(parsed.data.monthlyBudget) : null,
  });
  revalidateAll();
  return { error: null };
}

export async function updateCategory(id: string, input: unknown): Promise<CategoryActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };

  await db
    .update(categories)
    .set({
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      monthlyBudget: parsed.data.monthlyBudget != null ? String(parsed.data.monthlyBudget) : null,
    })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function deleteCategory(id: string): Promise<{ archived: boolean }> {
  const userId = await requireUserId();
  const hasTransactions = await categoryHasTransactions(userId, id);

  if (hasTransactions) {
    await db
      .update(categories)
      .set({ archived: true })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    revalidateAll();
    return { archived: true };
  }

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidateAll();
  return { archived: false };
}
