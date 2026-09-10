"use client";

import { createElement, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CouponForm } from "./CouponForm";
import { deleteCoupon } from "@/app/actions/coupons";
import { getCategoryIcon } from "@/lib/icons";
import { formatDateLabel } from "@/lib/format";
import { generatePdfReport } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  COUPON_TYPES,
  daysUntilExpiry,
  formatCouponValue,
  getExpiryUrgency,
  isBestValue,
  sortByExpiry,
  type CouponItem,
  type CouponType,
} from "@/lib/coupons";

function ExpiryBadge({ item }: { item: CouponItem }) {
  const urgency = getExpiryUrgency(item);
  if (urgency === "none" || !item.expiryDate) {
    return <span className="text-xs text-zinc-300">No expiry set</span>;
  }

  const days = daysUntilExpiry(item.expiryDate);
  const label =
    urgency === "expired"
      ? `Expired ${Math.abs(days)}d ago`
      : days === 0
        ? "Expires today"
        : `Expires in ${days}d`;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        urgency === "expired" && "bg-zinc-100 text-zinc-400 line-through",
        urgency === "soon" && "bg-amber-50 text-amber-600",
        urgency === "normal" && "bg-zinc-100 text-zinc-500"
      )}
    >
      {label} · {formatDateLabel(item.expiryDate)}
    </span>
  );
}

function TypeSection({ type, label, icon, items }: {
  type: CouponType;
  label: string;
  icon: string;
  items: CouponItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const rows = sortByExpiry(items.filter((i) => i.type === type));

  function handleDelete(id: string) {
    if (!window.confirm("Delete this entry?")) return;
    startTransition(async () => {
      await deleteCoupon(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            {createElement(getCategoryIcon(icon), { className: "h-4 w-4" })}
          </span>
          <CardTitle className="text-sm font-semibold text-zinc-900">{label}</CardTitle>
        </div>
        <CouponForm
          type={type}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        {rows.length === 0 && <p className="py-3 text-center text-sm text-zinc-400">No entries yet.</p>}
        {rows.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
              getExpiryUrgency(item) === "expired" ? "border-zinc-100 opacity-60" : "border-zinc-100"
            )}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm text-zinc-800">
                <span className="font-medium">{item.merchant}</span>
                <span className="text-zinc-400">·</span>
                <span className="truncate">{item.title}</span>
                {isBestValue(item, items) && (
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <Sparkles className="h-3 w-3" /> Best value
                  </span>
                )}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-600">{formatCouponValue(item)}</span>
                {item.code && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600">
                    {item.code}
                  </span>
                )}
                <ExpiryBadge item={item} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <CouponForm
                item={item}
                type={type}
                trigger={
                  <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
              <button
                disabled={isPending}
                onClick={() => handleDelete(item.id)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CouponsClient({ items }: { items: CouponItem[] }) {
  const active = items.filter((i) => getExpiryUrgency(i) !== "expired");
  const soonCount = items.filter((i) => getExpiryUrgency(i) === "soon").length;
  const expiredCount = items.filter((i) => getExpiryUrgency(i) === "expired").length;
  const bestValueCount = items.filter((i) => isBestValue(i, items)).length;

  const kpis = [
    { label: "Active", value: String(active.length), tone: "neutral" as const },
    { label: "Expiring Within 14 Days", value: String(soonCount), tone: "success" as const },
    { label: "Expired", value: String(expiredCount), tone: "danger" as const },
    { label: "Best Value Picks", value: String(bestValueCount), tone: "invest" as const },
  ];

  function handleExportPdf() {
    generatePdfReport({
      title: "Coupons & Offers",
      subtitle: `Active: ${active.length} · Expiring within 14 days: ${soonCount} · Expired: ${expiredCount}`,
      sections: COUPON_TYPES.map((meta) => ({
        heading: meta.label,
        columns: ["Merchant", "Offer", "Code", "Value", "Expiry"],
        rows: sortByExpiry(items.filter((i) => i.type === meta.type)).map((i) => [
          i.merchant,
          i.title,
          i.code ?? "",
          formatCouponValue(i),
          i.expiryDate ? formatDateLabel(i.expiryDate) : "—",
        ]),
      })),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Coupons & Offers</h1>
          <p className="text-sm text-zinc-500">
            Track coupon codes, offers, and gift cards — see what&apos;s expiring soon and what&apos;s worth the most.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums sm:text-2xl",
                  kpi.tone === "danger" && "text-red-600",
                  kpi.tone === "success" && "text-emerald-600",
                  kpi.tone === "invest" && "text-indigo-600",
                  kpi.tone === "neutral" && "text-zinc-900"
                )}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COUPON_TYPES.map((meta) => (
          <TypeSection key={meta.type} type={meta.type} label={meta.label} icon={meta.icon} items={items} />
        ))}
      </div>
    </div>
  );
}
