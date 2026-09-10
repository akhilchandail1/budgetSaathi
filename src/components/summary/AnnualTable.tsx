import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface AnnualRow {
  period: string; // pre-formatted display label
  planned: number;
  actual: number;
  income: number;
  variance: number; // planned - actual
}

export function AnnualTable({
  rows,
  periodLabel = "Month",
  showBudget = true,
}: {
  rows: AnnualRow[];
  periodLabel?: string;
  showBudget?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
            <th className="px-4 py-3 font-medium">{periodLabel}</th>
            {showBudget && <th className="px-4 py-3 text-right font-medium">Budget Total</th>}
            <th className="px-4 py-3 text-right font-medium">
              {showBudget ? "Actual Spend" : "Total Expense"}
            </th>
            <th className="px-4 py-3 text-right font-medium">Total Income</th>
            {showBudget && <th className="px-4 py-3 text-right font-medium">Variance</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.period} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50">
              <td className="px-4 py-2.5 text-zinc-800">{row.period}</td>
              {showBudget && (
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">
                  {formatINR(row.planned)}
                </td>
              )}
              <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{formatINR(row.actual)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-indigo-600">{formatINR(row.income)}</td>
              {showBudget && (
                <td
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums font-medium",
                    row.variance >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {formatINR(Math.abs(row.variance))} {row.variance >= 0 ? "under" : "over"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
