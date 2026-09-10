import { formatINR } from "./format";

export type CouponType = "coupon" | "offer" | "gift_card";
export type CouponValueType = "flat" | "percent";

export interface CouponItem {
  id: string;
  type: CouponType;
  merchant: string;
  title: string;
  code: string | null;
  value: number;
  valueType: CouponValueType;
  expiryDate: string | null; // ISO date
  notes: string | null;
}

export interface CouponTypeMeta {
  type: CouponType;
  label: string;
  icon: string;
}

export const COUPON_TYPES: CouponTypeMeta[] = [
  { type: "coupon", label: "Coupon Codes", icon: "Tag" },
  { type: "offer", label: "Offers", icon: "Percent" },
  { type: "gift_card", label: "Gift Cards", icon: "Gift" },
];

export function getCouponTypeMeta(type: CouponType): CouponTypeMeta {
  return COUPON_TYPES.find((t) => t.type === type) ?? COUPON_TYPES[0];
}

export function formatCouponValue(item: CouponItem): string {
  return item.valueType === "percent" ? `${item.value}% off` : `${formatINR(item.value)} value`;
}

export function daysUntilExpiry(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryUrgency = "expired" | "soon" | "normal" | "none";

export function getExpiryUrgency(item: CouponItem): ExpiryUrgency {
  if (!item.expiryDate) return "none";
  const days = daysUntilExpiry(item.expiryDate);
  if (days < 0) return "expired";
  if (days <= 14) return "soon";
  return "normal";
}

/** Best value = highest value among non-expired items of the same type and value unit (₹ vs %). */
export function isBestValue(item: CouponItem, allItems: CouponItem[]): boolean {
  const group = allItems.filter(
    (i) => i.type === item.type && i.valueType === item.valueType && getExpiryUrgency(i) !== "expired"
  );
  if (group.length < 2 || getExpiryUrgency(item) === "expired") return false;
  const maxValue = Math.max(...group.map((i) => i.value));
  return item.value === maxValue && maxValue > 0;
}

export function sortByExpiry(items: CouponItem[]): CouponItem[] {
  return items.slice().sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return a.merchant.localeCompare(b.merchant);
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });
}
