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

export async function getDashboardStats(): Promise<StatsData> {
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
}
