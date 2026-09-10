"use client";

import { useMemo, useState } from "react";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayTransactionsDialog } from "./DayTransactionsDialog";
import { buildCalendarSummary } from "@/lib/selectors";
import {
  dateFromDayOfMonth,
  formatCompactINR,
  formatINR,
  getDaysInMonth,
  getMonthKey,
  getMonthStartWeekday,
  getTodayISO,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({
  categories,
  transactions,
}: {
  categories: Category[];
  transactions: Transaction[];
}) {
  const [month, setMonth] = useState(getMonthKey());
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const daySummaries = useMemo(
    () => buildCalendarSummary(transactions, categories, month),
    [transactions, categories, month]
  );

  const days = Array.from(daySummaries.values());
  const monthTotalExpense = days.reduce((sum, d) => sum + d.totalExpense, 0);
  const monthTransactionCount = days.reduce((sum, d) => sum + d.transactionCount, 0);
  const activeDayCount = days.length;
  const highestDay = days.slice().sort((a, b) => b.totalExpense - a.totalExpense)[0];

  const today = getTodayISO();
  const daysInMonth = getDaysInMonth(month);
  const startWeekday = getMonthStartWeekday(month);
  const cells: (string | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateFromDayOfMonth(month, i + 1)),
  ];

  const kpis = [
    { label: "Total Spent", value: formatINR(monthTotalExpense) },
    { label: "Transactions", value: String(monthTransactionCount) },
    { label: "Active Days", value: String(activeDayCount) },
    { label: "Highest Spend Day", value: highestDay ? formatINR(highestDay.totalExpense) : "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Calendar</h1>
          <p className="text-sm text-zinc-500">See daily spending and transaction activity at a glance.</p>
        </div>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl font-semibold tabular-nums text-zinc-900 sm:text-2xl">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium text-zinc-400">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const summary = daySummaries.get(date);
              const dayNum = Number(date.slice(-2));
              const isToday = date === today;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => summary && setActiveDate(date)}
                  disabled={!summary}
                  className={cn(
                    "flex min-h-[4.5rem] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-[5.5rem] sm:p-2",
                    summary
                      ? "cursor-pointer border-zinc-200 bg-white hover:border-zinc-400"
                      : "border-transparent",
                    isToday && "ring-2 ring-zinc-900 ring-offset-1"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday ? "text-zinc-900" : "text-zinc-400")}>
                    {dayNum}
                  </span>
                  {summary && summary.totalExpense > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-red-600 sm:text-sm">
                      {formatCompactINR(summary.totalExpense)}
                    </span>
                  )}
                  {summary && (
                    <span className="text-[10px] text-zinc-400">
                      {summary.transactionCount} txn{summary.transactionCount === 1 ? "" : "s"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DayTransactionsDialog
        date={activeDate}
        transactions={transactions}
        categories={categories}
        onClose={() => setActiveDate(null)}
      />
    </div>
  );
}
