"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, categoryTypeValues, paymentModeValues, transactions } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

const importSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().trim().min(1),
      type: z.enum(categoryTypeValues),
      icon: z.string().trim().optional(),
      monthlyBudget: z.number().nonnegative().nullable().optional(),
    })
  ),
  transactions: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      category: z.string().trim().min(1),
      amount: z.number().positive(),
      paymentMode: z.enum(paymentModeValues),
      note: z.string().trim().optional(),
    })
  ),
});

export async function importBudgetData(raw: unknown): Promise<{ error: string | null; imported: number }> {
  const userId = await requireUserId();
  const parsed = importSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "That file doesn't look like a BudgetSaathi export.", imported: 0 };
  }

  const existing = await db.select().from(categories).where(eq(categories.userId, userId));
  const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

  for (const c of parsed.data.categories) {
    const key = c.name.toLowerCase();
    if (byName.has(key)) continue;
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name: c.name,
        type: c.type,
        icon: c.icon || "Circle",
        monthlyBudget: c.monthlyBudget != null ? String(c.monthlyBudget) : null,
      })
      .returning();
    byName.set(key, created);
  }

  const rows = parsed.data.transactions
    .map((t) => {
      const category = byName.get(t.category.toLowerCase());
      if (!category) return null;
      return {
        userId,
        categoryId: category.id,
        date: t.date,
        amount: String(t.amount),
        paymentMode: t.paymentMode,
        note: t.note || null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    await db.insert(transactions).values(rows);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/summary");
  return { error: null, imported: rows.length };
}
