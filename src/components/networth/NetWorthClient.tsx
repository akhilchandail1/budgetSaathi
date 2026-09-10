"use client";

import { createElement, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetWorthItemForm } from "./NetWorthItemForm";
import { NetWorthTrendChart } from "./NetWorthTrendChart";
import { deleteNetWorthItem } from "@/app/actions/netWorth";
import { getCategoryIcon } from "@/lib/icons";
import { formatINR } from "@/lib/format";
import { generatePdfReport } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  computeNetWorthTotals,
  NET_WORTH_TYPES,
  type NetWorthItem,
  type NetWorthSnapshot,
} from "@/lib/netWorth";

function TypeSection({ type, label, icon, items }: {
  type: NetWorthItem["type"];
  label: string;
  icon: string;
  items: NetWorthItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const rows = items.filter((i) => i.type === type);
  const total = rows.reduce((sum, i) => sum + i.amount, 0);

  function handleDelete(id: string) {
    if (!window.confirm("Delete this entry?")) return;
    startTransition(async () => {
      await deleteNetWorthItem(id);
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
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900">{label}</CardTitle>
            <p className="text-xs text-zinc-400">{formatINR(total)}</p>
          </div>
        </div>
        <NetWorthItemForm
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
            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-800">{item.name}</p>
              {item.notes && <p className="truncate text-xs text-zinc-400">{item.notes}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-sm font-medium tabular-nums text-zinc-900">
                {formatINR(item.amount)}
              </span>
              <NetWorthItemForm
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

export function NetWorthClient({
  items,
  snapshots,
}: {
  items: NetWorthItem[];
  snapshots: NetWorthSnapshot[];
}) {
  const totals = computeNetWorthTotals(items);
  const isNegative = totals.netWorth < 0;

  const kpis = [
    { label: "Total Assets", value: totals.totalAssets, tone: "success" as const },
    { label: "Total Liabilities", value: totals.totalLiabilities, tone: "danger" as const },
    {
      label: "Net Worth",
      value: Math.abs(totals.netWorth),
      tone: isNegative ? ("danger" as const) : ("invest" as const),
    },
    { label: "Monthly SIP Commitment", value: totals.monthlySip, tone: "neutral" as const },
  ];

  function handleExportPdf() {
    generatePdfReport({
      title: "Net Worth Report",
      subtitle: `Net worth: ${formatINR(totals.netWorth)} · Assets: ${formatINR(totals.totalAssets)} · Liabilities: ${formatINR(totals.totalLiabilities)}`,
      sections: NET_WORTH_TYPES.map((meta) => ({
        heading: meta.label,
        columns: ["Name", "Amount", "Notes"],
        rows: items
          .filter((i) => i.type === meta.type)
          .map((i) => [i.name, formatINR(i.amount), i.notes ?? ""]),
      })),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Net Worth</h1>
          <p className="text-sm text-zinc-500">
            Everything you own and owe, in one view — updated automatically as you edit entries.
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
                {formatINR(kpi.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthTrendChart snapshots={snapshots} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {NET_WORTH_TYPES.map((meta) => (
          <TypeSection key={meta.type} type={meta.type} label={meta.label} icon={meta.icon} items={items} />
        ))}
      </div>
    </div>
  );
}
