import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthSummary } from "@/lib/selectors";

export function KpiCards({ summary }: { summary: MonthSummary }) {
  const isNegative = summary.net < 0;

  const cards = [
    { label: "Total Income", value: summary.totalIncome, tone: "success" as const },
    { label: "Total Expenses", value: summary.totalExpense, tone: "danger" as const },
    {
      label: isNegative ? "Net (Overspent)" : "Net (Saved)",
      value: Math.abs(summary.net),
      tone: isNegative ? ("danger" as const) : ("success" as const),
    },
    { label: "Total Monthly Budget", value: summary.totalBudget, tone: "invest" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle>{card.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p
              className={cn(
                "text-xl font-semibold tabular-nums sm:text-2xl",
                card.tone === "danger" && "text-red-600",
                card.tone === "success" && "text-emerald-600",
                card.tone === "invest" && "text-indigo-600"
              )}
            >
              {formatINR(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
