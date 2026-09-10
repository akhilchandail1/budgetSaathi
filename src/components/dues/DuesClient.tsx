"use client";

import { createElement, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DuesItemForm } from "./DuesItemForm";
import { deleteDue } from "@/app/actions/dues";
import { getCategoryIcon } from "@/lib/icons";
import { formatDateLabel, formatINR } from "@/lib/format";
import { generatePdfReport } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  computeDuesTotals,
  daysUntil,
  DUES_CATEGORIES,
  getDueUrgency,
  sortByDueDate,
  type DuesCategory,
  type DuesItem,
} from "@/lib/dues";

function DueBadge({ item }: { item: DuesItem }) {
  const urgency = getDueUrgency(item);
  if (urgency === "none" || !item.nextDueDate) return <span className="text-xs text-zinc-300">No date set</span>;

  const days = daysUntil(item.nextDueDate);
  const label =
    urgency === "overdue"
      ? `Overdue by ${Math.abs(days)}d`
      : days === 0
        ? "Due today"
        : `Due in ${days}d`;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        urgency === "overdue" && "bg-red-50 text-red-600",
        urgency === "soon" && "bg-amber-50 text-amber-600",
        urgency === "normal" && "bg-zinc-100 text-zinc-500"
      )}
    >
      {label} · {formatDateLabel(item.nextDueDate)}
    </span>
  );
}

function CategorySection({ category, label, icon, items }: {
  category: DuesCategory;
  label: string;
  icon: string;
  items: DuesItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const rows = sortByDueDate(items.filter((i) => i.category === category));

  function handleDelete(id: string) {
    if (!window.confirm("Delete this due?")) return;
    startTransition(async () => {
      await deleteDue(id);
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
        <DuesItemForm
          category={category}
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
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-800">{item.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {formatINR(item.amount)} / {item.cycle === "monthly" ? "mo" : "yr"}
                </span>
                <DueBadge item={item} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <DuesItemForm
                item={item}
                category={category}
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

export function DuesClient({ items }: { items: DuesItem[] }) {
  const totals = computeDuesTotals(items);
  const overdueCount = items.filter((i) => getDueUrgency(i) === "overdue").length;
  const soonCount = items.filter((i) => getDueUrgency(i) === "soon").length;

  const kpis = [
    { label: "Total Monthly Recurring", value: formatINR(totals.totalMonthly), tone: "neutral" as const },
    { label: "Total Yearly Recurring", value: formatINR(totals.totalYearly), tone: "invest" as const },
    { label: "Due Within 7 Days", value: String(soonCount), tone: "success" as const },
    { label: "Overdue", value: String(overdueCount), tone: "danger" as const },
  ];

  function handleExportPdf() {
    generatePdfReport({
      title: "Dues & Subscriptions",
      subtitle: `Monthly recurring: ${formatINR(totals.totalMonthly)} · Yearly: ${formatINR(totals.totalYearly)}`,
      sections: DUES_CATEGORIES.map((meta) => ({
        heading: meta.label,
        columns: ["Name", "Amount", "Cycle", "Next Due"],
        rows: sortByDueDate(items.filter((i) => i.category === meta.category)).map((i) => [
          i.name,
          formatINR(i.amount),
          i.cycle === "monthly" ? "Monthly" : "Yearly",
          i.nextDueDate ? formatDateLabel(i.nextDueDate) : "—",
        ]),
      })),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dues & Subscriptions</h1>
          <p className="text-sm text-zinc-500">
            Credit card dues, subscriptions, insurance, and other recurring costs — all in one place.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DUES_CATEGORIES.map((meta) => (
          <CategorySection key={meta.category} category={meta.category} label={meta.label} icon={meta.icon} items={items} />
        ))}
      </div>
    </div>
  );
}
