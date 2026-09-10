"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORICAL, CHART_INK } from "@/lib/chartColors";
import { formatCompactINR, formatINR, formatMonthShort } from "@/lib/format";
import type { NetWorthSnapshot } from "@/lib/netWorth";

export function NetWorthTrendChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const data = snapshots.map((s) => ({ month: formatMonthShort(s.month), netWorth: s.netWorth }));

  if (data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-zinc-400">
        Add net worth entries to start tracking your trend.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
          <XAxis
            dataKey="month"
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
            tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_INK.muted, fontSize: 12 }}
            tickFormatter={(v) => formatCompactINR(v)}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: CHART_INK.gridline }}
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline, fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke={CATEGORICAL[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
