"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { netWorthItems, netWorthItemTypeValues, netWorthSnapshots } from "@/db/schema";
import { computeNetWorthTotals, NET_WORTH_TYPES } from "@/lib/netWorth";
import { getMonthKey } from "@/lib/format";
import type { NetWorthItem } from "@/lib/netWorth";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function recalcSnapshot(userId: string) {
  const rows = await db.select().from(netWorthItems).where(eq(netWorthItems.userId, userId));
  const items: NetWorthItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    amount: Number(row.amount),
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  }));
  const totals = computeNetWorthTotals(items);
  const breakdown = Object.fromEntries(
    NET_WORTH_TYPES.map((t) => [t.type, totals.byType[t.type] ?? 0])
  );

  await db
    .insert(netWorthSnapshots)
    .values({
      userId,
      month: getMonthKey(),
      breakdown,
      netWorth: String(totals.netWorth),
    })
    .onConflictDoUpdate({
      target: [netWorthSnapshots.userId, netWorthSnapshots.month],
      set: { breakdown, netWorth: String(totals.netWorth) },
    });
}

function revalidateAll() {
  revalidatePath("/net-worth");
}

const netWorthItemSchema = z.object({
  type: z.enum(netWorthItemTypeValues),
  name: z.string().trim().min(1, "Name is required").max(80),
  amount: z.number().nonnegative(),
  notes: z.string().trim().max(300).optional(),
});

export type NetWorthActionState = { error: string | null };

export async function createNetWorthItem(input: unknown): Promise<NetWorthActionState> {
  const userId = await requireUserId();
  const parsed = netWorthItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db.insert(netWorthItems).values({
    userId,
    type: parsed.data.type,
    name: parsed.data.name,
    amount: String(parsed.data.amount),
    notes: parsed.data.notes || null,
  });
  await recalcSnapshot(userId);
  revalidateAll();
  return { error: null };
}

export async function updateNetWorthItem(id: string, input: unknown): Promise<NetWorthActionState> {
  const userId = await requireUserId();
  const parsed = netWorthItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db
    .update(netWorthItems)
    .set({
      type: parsed.data.type,
      name: parsed.data.name,
      amount: String(parsed.data.amount),
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(netWorthItems.id, id), eq(netWorthItems.userId, userId)));
  await recalcSnapshot(userId);
  revalidateAll();
  return { error: null };
}

export async function deleteNetWorthItem(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(netWorthItems).where(and(eq(netWorthItems.id, id), eq(netWorthItems.userId, userId)));
  await recalcSnapshot(userId);
  revalidateAll();
}
