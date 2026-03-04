import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Trend {
  delta: number;
  percent: number | null;
}

interface StatCardProps {
  title: string;
  value: string;
  trend?: Trend;
  children?: React.ReactNode;
  valueClassName?: string;
}

export function StatCard({ title, value, trend, children, valueClassName }: StatCardProps) {
  const isPositive = trend && trend.delta > 0;
  const isNegative = trend && trend.delta < 0;
  const isFlat = trend && trend.delta === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className={cn("text-2xl font-semibold", valueClassName)}>{value}</p>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              isPositive && "text-green-500",
              isNegative && "text-destructive",
              isFlat && "text-muted-foreground"
            )}
          >
            {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
            {isFlat && <Minus className="h-3.5 w-3.5" />}
            <span>
              {trend.delta > 0 ? "+" : ""}
              {trend.delta.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              {trend.percent !== null ? ` (${trend.percent > 0 ? "+" : ""}${trend.percent}%)` : " —"}
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        )}

        {children && <div className="pt-1">{children}</div>}
      </CardContent>
    </Card>
  );
}
