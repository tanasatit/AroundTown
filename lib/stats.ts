import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { calculateCollectionMetrics, getCurrentWeekNumber } from '@/lib/calculations';

export interface StatsData {
  thisWeek: {
    weekNumber: number;
    revenue: number;
    postcardsSold: number;
    profit: number;
    collections: number;
  };
  lastWeek: {
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

function sumRows(rows: Awaited<ReturnType<typeof prisma.collection.findMany>>) {
  return rows.reduce(
    (acc, row) => {
      const m = calculateCollectionMetrics(row);
      return {
        revenue: acc.revenue + m.revenue,
        postcardsSold: acc.postcardsSold + m.postcardsSold,
        profit: acc.profit + m.profit,
        collections: acc.collections + 1,
      };
    },
    { revenue: 0, postcardsSold: 0, profit: 0, collections: 0 }
  );
}

function trend(current: number, previous: number) {
  const delta = current - previous;
  const percent = previous === 0 ? null : Math.round((delta / previous) * 1000) / 10;
  return { delta, percent };
}

export interface ChartWeek {
  weekNumber: number;
  revenue: number;
  profit: number;
  postcardsSold: number;
}

export interface ChartData {
  weeks: ChartWeek[];
  hasEnoughData: boolean;
}

export const getChartData = unstable_cache(
  async (): Promise<ChartData> => {
    const currentWeek = getCurrentWeekNumber();
    const startWeek = currentWeek - 7;

    const rows = await prisma.collection.findMany({
      where: { weekNumber: { gte: startWeek, lte: currentWeek } },
    });

    const byWeek = new Map<number, { revenue: number; profit: number; postcardsSold: number; hasData: boolean }>();
    for (let w = startWeek; w <= currentWeek; w++) {
      byWeek.set(w, { revenue: 0, profit: 0, postcardsSold: 0, hasData: false });
    }
    for (const row of rows) {
      const m = calculateCollectionMetrics(row);
      const existing = byWeek.get(row.weekNumber)!;
      byWeek.set(row.weekNumber, {
        revenue: existing.revenue + m.revenue,
        profit: existing.profit + m.profit,
        postcardsSold: existing.postcardsSold + m.postcardsSold,
        hasData: true,
      });
    }

    const weeks: ChartWeek[] = Array.from(byWeek.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, data]) => ({ weekNumber, revenue: data.revenue, profit: data.profit, postcardsSold: data.postcardsSold }));

    const weeksWithData = weeks.filter((w) => w.revenue > 0 || w.postcardsSold > 0).length;

    return { weeks, hasEnoughData: weeksWithData >= 2 };
  },
  ['chart-data'],
  { revalidate: 300, tags: ['collections'] }
);

export const getDashboardStats = unstable_cache(
  async (): Promise<StatsData> => {
    const currentWeek = getCurrentWeekNumber();
    const lastWeek = currentWeek - 1;

    const [thisWeekRows, lastWeekRows, latestPerLocation] = await Promise.all([
      prisma.collection.findMany({ where: { weekNumber: currentWeek } }),
      prisma.collection.findMany({ where: { weekNumber: lastWeek } }),
      prisma.$queryRaw<{ machineLocation: string; postcardsRemaining: number }[]>`
        SELECT DISTINCT ON ("machineLocation") "machineLocation", "postcardsRemaining"
        FROM collections
        ORDER BY "machineLocation", "collectionDate" DESC, "roundNumber" DESC
      `,
    ]);

    const thisWeekStats = { weekNumber: currentWeek, ...sumRows(thisWeekRows) };
    const lastWeekStats = { weekNumber: lastWeek, ...sumRows(lastWeekRows) };

    return {
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      trends: {
        revenue: trend(thisWeekStats.revenue, lastWeekStats.revenue),
        postcardsSold: trend(thisWeekStats.postcardsSold, lastWeekStats.postcardsSold),
        profit: trend(thisWeekStats.profit, lastWeekStats.profit),
      },
      inventory: {
        total: latestPerLocation.reduce((sum, r) => sum + r.postcardsRemaining, 0),
        byLocation: latestPerLocation.map((r) => ({
          location: r.machineLocation,
          remaining: r.postcardsRemaining,
        })),
      },
    };
  },
  ['dashboard-stats'],
  { revalidate: 300, tags: ['collections'] }
);
