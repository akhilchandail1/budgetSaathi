"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL, CHART_OTHER } from "@/lib/chartColors";
import { formatINR } from "@/lib/format";

export interface DonutSlice {
  name: string;
  value: number;
}

const MAX_SLICES = 6;

export function CategoryDonut({ data }: { data: DonutSlice[] }) {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const restTotal = rest.reduce((sum, d) => sum + d.value, 0);
  const slices = restTotal > 0 ? [...top, { name: "Other", value: restTotal }] : top;

  if (slices.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-zinc-400">
        No expenses logged for this period yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            stroke="#fcfcfb"
            strokeWidth={2}
          >
            {slices.map((slice, i) => (
              <Cell
                key={slice.name}
                fill={slice.name === "Other" ? CHART_OTHER : CATEGORICAL[i % CATEGORICAL.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatINR(Number(value))}
            contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 13 }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 12, color: "#52514e" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
