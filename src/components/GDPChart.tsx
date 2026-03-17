"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#F43F5E",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#94A3B8",
];

interface Props {
  data: Record<string, string | number>[];
  countries: string[];
  unit: string;
}

export default function GDPChart({ data, countries, unit }: Props) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A2744" />
        <XAxis
          dataKey="year"
          stroke="#8492B4"
          tick={{ fontSize: 11, fill: "#8492B4" }}
        />
        <YAxis
          stroke="#8492B4"
          tick={{ fontSize: 11, fill: "#8492B4" }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0D1526",
            border: "1px solid #1A2744",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#8492B4" }}
          formatter={(value: number) => [
            value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            "",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
        />
        {countries.map((country, i) => (
          <Line
            key={country}
            type="monotone"
            dataKey={country}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
