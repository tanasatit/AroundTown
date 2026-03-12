import { StatCard } from "./stat-card";

interface StatsData {
  thisWeek: {
    weekNumber: number;
    revenue: number;
    postcardsSold: number;
    profit: number;
    collections: number;
  };
  trends: {
    revenue: { delta: number; percent: number | null };
    postcardsSold: { delta: number; percent: number | null };
    profit: { delta: number; percent: number | null };
  };
  inventory: {
    total: number;
    byLocation: { location: string; remaining: number }[];
  };
}

function formatCurrency(amount: number) {
  return "฿" + amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function StatsCards({ data }: { data: StatsData }) {
  if (data.thisWeek.collections === 0 && data.inventory.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">No collections recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Record your first collection to see stats here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Revenue This Week"
        value={formatCurrency(data.thisWeek.revenue)}
        trend={data.trends.revenue}
        valueClassName="text-thai-gold"
      />

      <StatCard
        title="Postcards Sold"
        value={data.thisWeek.postcardsSold.toLocaleString()}
        trend={data.trends.postcardsSold}
      />

      <StatCard
        title="Profit This Week"
        value={formatCurrency(data.thisWeek.profit)}
        trend={data.trends.profit}
        valueClassName="text-green-500"
      />

      <StatCard
        title="Inventory"
        value={data.inventory.total.toLocaleString()}
      >
        {data.inventory.byLocation.length > 0 && (
          <ul className="space-y-1">
            {data.inventory.byLocation.map((loc) => (
              <li key={loc.location} className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate pr-2">{loc.location.split(" - ")[0]}</span>
                <span className="shrink-0">{loc.remaining}</span>
              </li>
            ))}
          </ul>
        )}
      </StatCard>
    </div>
  );
}
