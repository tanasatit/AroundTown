"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ChartData } from "@/lib/stats";

const revenueProfitConfig = {
  revenue: { label: "Revenue", color: "#D4AF37" },
  profit: { label: "Profit", color: "#22c55e" },
} satisfies ChartConfig;

const postcardsConfig = {
  postcardsSold: { label: "Postcards Sold", color: "#D4AF37" },
} satisfies ChartConfig;

function formatWeek(weekNumber: number) {
  return `Wk ${weekNumber}`;
}

export function DashboardCharts({ data }: { data: ChartData }) {
  if (!data.hasEnoughData) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Not enough data yet — charts appear after 2 weeks of collections.
      </div>
    );
  }

  const chartData = data.weeks.map((w) => ({
    ...w,
    week: formatWeek(w.weekNumber),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Revenue & Profit Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue & Profit</CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]" />
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Profit
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueProfitConfig} className="h-52 w-full">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const label = name === "revenue" ? "Revenue" : "Profit";
                      const formatted = "฿" + Number(value).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                      return [formatted, label];
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#fillRevenue)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#fillProfit)"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Postcards Sold Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Postcards Sold</CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#D4AF37]" />
              Postcards
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={postcardsConfig} className="h-52 w-full">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [value.toString(), "Postcards"]}
                  />
                }
              />
              <Bar
                dataKey="postcardsSold"
                fill="#D4AF37"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
