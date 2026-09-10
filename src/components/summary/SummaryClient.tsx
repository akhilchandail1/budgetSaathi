"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/summary/TrendChart";
import { CategoryDonut } from "@/components/summary/CategoryDonut";
import { AnnualTable } from "@/components/summary/AnnualTable";
import { buildMonthSummary, buildPeriodTotals } from "@/lib/selectors";
import { generatePdfReport } from "@/lib/pdf";
import {
  formatINR,
  formatMonthLabel,
  formatMonthShort,
  formatWeekLabel,
  formatWeekShort,
  getMonthKey,
  getWeekStartISO,
  getYearKey,
  listRecentMonths,
  listRecentWeeks,
  listRecentYears,
  monthKeyFromISO,
  weekKeyFromISO,
  yearKeyFromISO,
} from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

type Granularity = "weekly" | "monthly" | "yearly";

const RANGE_OPTIONS: Record<Granularity, { label: string; value: number }[]> = {
  weekly: [
    { label: "Last 8 weeks", value: 8 },
    { label: "Last 12 weeks", value: 12 },
  ],
  monthly: [
    { label: "Last 6 months", value: 6 },
    { label: "Last 12 months", value: 12 },
  ],
  yearly: [
    { label: "Last 3 years", value: 3 },
    { label: "Last 5 years", value: 5 },
  ],
};

const DEFAULT_RANGE: Record<Granularity, number> = { weekly: 8, monthly: 6, yearly: 3 };

export function SummaryClient({
  categories,
  transactions,
}: {
  categories: Category[];
  transactions: Transaction[];
}) {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [rangeSize, setRangeSize] = useState(DEFAULT_RANGE.monthly);

  function handleGranularityChange(next: Granularity) {
    setGranularity(next);
    setRangeSize(DEFAULT_RANGE[next]);
  }

  const periods = useMemo(() => {
    if (granularity === "weekly") return listRecentWeeks(rangeSize, getWeekStartISO());
    if (granularity === "yearly") return listRecentYears(rangeSize, getYearKey());
    return listRecentMonths(rangeSize, getMonthKey());
  }, [granularity, rangeSize]);

  const periodKeyFromISO =
    granularity === "weekly" ? weekKeyFromISO : granularity === "yearly" ? yearKeyFromISO : monthKeyFromISO;

  const periodLabel = (p: string) => {
    if (granularity === "weekly") return formatWeekLabel(p);
    if (granularity === "yearly") return p;
    return formatMonthLabel(p);
  };
  const periodShortLabel = (p: string) => {
    if (granularity === "weekly") return formatWeekShort(p);
    if (granularity === "yearly") return p;
    return formatMonthShort(p);
  };

  // Monthly keeps the standing-budget-vs-actual view; weekly/yearly show income vs. expense
  // (a standing monthly budget has no well-defined weekly/yearly equivalent).
  const monthlySummaries = useMemo(
    () =>
      granularity === "monthly"
        ? periods.map((m) => ({ period: m, summary: buildMonthSummary(categories, transactions, m) }))
        : [],
    [granularity, periods, categories, transactions]
  );

  const periodTotals = useMemo(
    () =>
      granularity !== "monthly"
        ? buildPeriodTotals(transactions, categories, periods, periodKeyFromISO)
        : [],
    [granularity, periods, transactions, categories, periodKeyFromISO]
  );

  const trendData =
    granularity === "monthly"
      ? monthlySummaries.map(({ period, summary }) => ({
          month: periodShortLabel(period),
          planned: summary.totalBudget,
          actual: summary.totalExpense,
        }))
      : periodTotals.map((p) => ({
          month: periodShortLabel(p.period),
          planned: p.income,
          actual: p.expense,
        }));

  const annualRows =
    granularity === "monthly"
      ? monthlySummaries.map(({ period, summary }) => ({
          period: periodLabel(period),
          planned: summary.totalBudget,
          actual: summary.totalExpense,
          income: summary.totalIncome,
          variance: summary.totalBudget - summary.totalExpense,
        }))
      : periodTotals.map((p) => ({
          period: periodLabel(p.period),
          planned: 0,
          actual: p.expense,
          income: p.income,
          variance: 0,
        }));

  const periodSet = new Set(periods);
  const donutData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (!periodSet.has(periodKeyFromISO(t.date))) continue;
      const category = categories.find((c) => c.id === t.categoryId);
      if (!category || category.type === "income") continue;
      totals.set(category.name, (totals.get(category.name) ?? 0) + t.amount);
    }
    return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, categories, transactions, periodKeyFromISO]);

  const periodLabelText = granularity === "weekly" ? "Week" : granularity === "yearly" ? "Year" : "Month";

  function handleExportPdf() {
    const columns = granularity === "monthly"
      ? [periodLabelText, "Budget Total", "Actual Spend", "Total Income", "Variance"]
      : [periodLabelText, "Total Expense", "Total Income"];
    generatePdfReport({
      title: "Analytics & Summary",
      subtitle: `${granularity[0].toUpperCase()}${granularity.slice(1)} view`,
      sections: [
        {
          columns,
          rows: annualRows.map((row) =>
            granularity === "monthly"
              ? [
                  row.period,
                  formatINR(row.planned),
                  formatINR(row.actual),
                  formatINR(row.income),
                  `${formatINR(Math.abs(row.variance))} ${row.variance >= 0 ? "under" : "over"}`,
                ]
              : [row.period, formatINR(row.actual), formatINR(row.income)]
          ),
        },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Analytics & Summary</h1>
          <p className="text-sm text-zinc-500">See trends across weeks, months, or years.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
          <div className="w-32">
            <Select
              value={granularity}
              onChange={(e) => handleGranularityChange(e.target.value as Granularity)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>
          <div className="w-40">
            <Select value={rangeSize} onChange={(e) => setRangeSize(Number(e.target.value))}>
              {RANGE_OPTIONS[granularity].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {granularity === "monthly" ? "Budget vs. Actual Trend" : "Income vs. Expense Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData}
              seriesLabels={
                granularity === "monthly"
                  ? { planned: "Budget", actual: "Actual" }
                  : { planned: "Income", actual: "Expense" }
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={donutData} />
          </CardContent>
        </Card>
      </div>

      <AnnualTable rows={annualRows} periodLabel={periodLabelText} showBudget={granularity === "monthly"} />
    </div>
  );
}
