"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORICAL, CHART_INK } from "@/lib/chartColors";
import { formatCompactINR, formatINR } from "@/lib/format";

export interface TrendPoint {
  month: string; // display label
  planned: number;
  actual: number;
}

export function TrendChart({
  data,
  seriesLabels = { planned: "Planned", actual: "Actual" },
}: {
  data: TrendPoint[];
  seriesLabels?: { planned: string; actual: string };
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
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
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline, fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK.secondary }} />
          <Bar dataKey="planned" name={seriesLabels.planned} fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="actual" name={seriesLabels.actual} fill={CATEGORICAL[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
