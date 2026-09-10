"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { couponTypeValues, coupons, couponValueTypeValues } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateAll() {
  revalidatePath("/coupons");
}

const couponSchema = z.object({
  type: z.enum(couponTypeValues),
  merchant: z.string().trim().min(1, "Merchant is required").max(80),
  title: z.string().trim().min(1, "Describe the offer").max(150),
  code: z.string().trim().max(60).optional(),
  value: z.number().positive(),
  valueType: z.enum(couponValueTypeValues),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional(),
});

export type CouponActionState = { error: string | null };

export async function createCoupon(input: unknown): Promise<CouponActionState> {
  const userId = await requireUserId();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db.insert(coupons).values({
    userId,
    type: parsed.data.type,
    merchant: parsed.data.merchant,
    title: parsed.data.title,
    code: parsed.data.code || null,
    value: String(parsed.data.value),
    valueType: parsed.data.valueType,
    expiryDate: parsed.data.expiryDate || null,
    notes: parsed.data.notes || null,
  });
  revalidateAll();
  return { error: null };
}

export async function updateCoupon(id: string, input: unknown): Promise<CouponActionState> {
  const userId = await requireUserId();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };

  await db
    .update(coupons)
    .set({
      type: parsed.data.type,
      merchant: parsed.data.merchant,
      title: parsed.data.title,
      code: parsed.data.code || null,
      value: String(parsed.data.value),
      valueType: parsed.data.valueType,
      expiryDate: parsed.data.expiryDate || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(coupons.id, id), eq(coupons.userId, userId)));
  revalidateAll();
  return { error: null };
}

export async function deleteCoupon(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(coupons).where(and(eq(coupons.id, id), eq(coupons.userId, userId)));
  revalidateAll();
}
