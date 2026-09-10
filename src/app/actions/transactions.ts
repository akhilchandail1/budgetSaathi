"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { DEMO_EMAIL } from "@/lib/demo.constants";
import { db } from "@/db";
import { paymentModeValues, transactions } from "@/db/schema";

const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().trim().max(200).optional(),
  paymentMode: z.enum(paymentModeValues),
});

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

export type TransactionActionState = { error: string | null };

export async function addTransaction(input: unknown): Promise<TransactionActionState> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid transaction" };

  await db.insert(transactions).values({
    userId,
    categoryId: parsed.data.categoryId,
    date: parsed.data.date,
    amount: String(parsed.data.amount),
    note: parsed.data.note || null,
    paymentMode: parsed.data.paymentMode,
  });
  revalidateAll();
  return { error: null };
}

export async function addTransactionsBulk(inputs: unknown[]): Promise<{ imported: number }> {
  const userId = await requireUserId();
  const parsed = inputs
    .map((input) => transactionSchema.safeParse(input))
    .filter((r) => r.success)
    .map((r) => r.data);
  if (parsed.length === 0) return { imported: 0 };

  await db.insert(transactions).values(
    parsed.map((data) => ({
      userId,
      categoryId: data.categoryId,
      date: data.date,
      amount: String(data.amount),
      note: data.note || null,
      paymentMode: data.paymentMode,
    }))
  );
  revalidateAll();
  return { imported: parsed.length };
}

export async function updateTransaction(id: string, input: unknown): Promise<TransactionActionState> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid transaction" };

  await db
    .update(transactions)
    .set({
      categoryId: parsed.data.categoryId,
      date: parsed.data.date,
      amount: String(parsed.data.amount),
      note: parsed.data.note || null,
      paymentMode: parsed.data.paymentMode,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function deleteTransaction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidateAll();
}
