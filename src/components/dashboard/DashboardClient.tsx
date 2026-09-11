"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { CategoryTable } from "@/components/dashboard/CategoryTable";
import { CategoryTransactionsDialog } from "@/components/dashboard/CategoryTransactionsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatINR, formatMonthLabel, getMonthKey } from "@/lib/format";
import { buildMonthSummary } from "@/lib/selectors";
import { generatePdfReport } from "@/lib/pdf";
import type { Category, CategoryBudget, Transaction } from "@/lib/types";

export function DashboardClient({
  categories,
  transactions,
  categoryBudgets,
}: {
  categories: Category[];
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
}) {
  const [month, setMonth] = useState(getMonthKey());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const summary = useMemo(
    () => buildMonthSummary(categories, transactions, month, categoryBudgets),
    [categories, transactions, month, categoryBudgets]
  );

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null;

  function handleExportPdf() {
    generatePdfReport({
      title: "Dashboard",
      subtitle: formatMonthLabel(month),
      sections: [
        {
          heading: "Expenses",
          columns: ["Category", "Budget", "Actual", "% Used"],
          rows: summary.expenseRows.map((r) => [
            r.category.name,
            r.budget != null ? formatINR(r.budget) : "—",
            formatINR(r.actual),
            r.percentSpent != null ? `${Math.round(r.percentSpent)}%` : "—",
          ]),
        },
        {
          heading: "Income",
          columns: ["Category", "Actual"],
          rows: summary.incomeRows.map((r) => [r.category.name, formatINR(r.actual)]),
        },
        {
          heading: "Investments",
          columns: ["Category", "Budget", "Actual", "% Used"],
          rows: summary.investmentRows.map((r) => [
            r.category.name,
            r.budget != null ? formatINR(r.budget) : "—",
            formatINR(r.actual),
            r.percentSpent != null ? `${Math.round(r.percentSpent)}%` : "—",
          ]),
        },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Track income, expenses, and investments, side by side.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
          <MonthSelector month={month} onChange={setMonth} />
        </div>
      </div>

      <KpiCards summary={summary} />

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income" data-demo-allow>
            Income
          </TabsTrigger>
          <TabsTrigger value="investment" data-demo-allow>
            Investments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">
          <CategoryTable
            rows={summary.expenseRows}
            type="expense"
            categories={categories}
            month={month}
            onCategoryClick={setActiveCategoryId}
          />
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <CategoryTable
            rows={summary.incomeRows}
            type="income"
            categories={categories}
            month={month}
            onCategoryClick={setActiveCategoryId}
          />
        </TabsContent>
        <TabsContent value="investment" className="mt-4">
          <CategoryTable
            rows={summary.investmentRows}
            type="investment"
            categories={categories}
            month={month}
            onCategoryClick={setActiveCategoryId}
          />
        </TabsContent>
      </Tabs>

      <CategoryTransactionsDialog
        category={activeCategory}
        transactions={transactions}
        onClose={() => setActiveCategoryId(null)}
      />
    </div>
  );
}
