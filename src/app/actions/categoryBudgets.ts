"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { DEMO_EMAIL } from "@/lib/demo.constants";
import { db } from "@/db";
import { categories, categoryBudgets } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.email === DEMO_EMAIL) throw new Error("The demo account is read-only.");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/summary");
}

const setCategoryBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month"),
  amount: z.number().nonnegative().nullable(),
});

export type CategoryBudgetActionState = { error: string | null };

/** Sets (or, when amount is null, clears) this category's budget override for one month. */
export async function setCategoryBudgetForMonth(input: unknown): Promise<CategoryBudgetActionState> {
  const userId = await requireUserId();
  const parsed = setCategoryBudgetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid budget" };
  const { categoryId, month, amount } = parsed.data;

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!category) return { error: "Category not found" };

  if (amount === null) {
    await db
      .delete(categoryBudgets)
      .where(and(eq(categoryBudgets.categoryId, categoryId), eq(categoryBudgets.month, month)));
    revalidateAll();
    return { error: null };
  }

  await db
    .insert(categoryBudgets)
    .values({ userId, categoryId, month, amount: String(amount) })
    .onConflictDoUpdate({
      target: [categoryBudgets.categoryId, categoryBudgets.month],
      set: { amount: String(amount), updatedAt: new Date() },
    });
  revalidateAll();
  return { error: null };
}
