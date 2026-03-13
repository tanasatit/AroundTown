import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { calculateCollectionMetrics } from '@/lib/calculations';

export interface WeekSummaryRow {
  weekNumber: number;
  collections: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface LocationRow {
  location: string;
  collections: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ReportsTotals {
  collections: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ReportsData {
  byWeek: WeekSummaryRow[];
  byLocation: LocationRow[];
  totals: ReportsTotals;
  isEmpty: boolean;
}

const ZERO_TOTALS: ReportsTotals = { collections: 0, postcardsSold: 0, revenue: 0, cost: 0, profit: 0 };

export const getReportsData = unstable_cache(
  async (): Promise<ReportsData> => getReportsDataImpl(),
  ['reports-data'],
  { revalidate: 300, tags: ['collections'] }
);

async function getReportsDataImpl(): Promise<ReportsData> {
  const rows = await prisma.collection.findMany({ orderBy: { collectionDate: 'desc' } });

  if (rows.length === 0) {
    return { byWeek: [], byLocation: [], totals: { ...ZERO_TOTALS }, isEmpty: true };
  }

  const weekMap = new Map<number, WeekSummaryRow>();
  const locationMap = new Map<string, LocationRow>();

  for (const row of rows) {
    const m = calculateCollectionMetrics(row);

    // By week
    const existing = weekMap.get(row.weekNumber) ?? {
      weekNumber: row.weekNumber,
      collections: 0,
      postcardsSold: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    weekMap.set(row.weekNumber, {
      ...existing,
      collections: existing.collections + 1,
      postcardsSold: existing.postcardsSold + m.postcardsSold,
      revenue: existing.revenue + m.revenue,
      cost: existing.cost + m.cost,
      profit: existing.profit + m.profit,
    });

    // By location
    const loc = locationMap.get(row.machineLocation) ?? {
      location: row.machineLocation,
      collections: 0,
      postcardsSold: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    locationMap.set(row.machineLocation, {
      ...loc,
      collections: loc.collections + 1,
      postcardsSold: loc.postcardsSold + m.postcardsSold,
      revenue: loc.revenue + m.revenue,
      cost: loc.cost + m.cost,
      profit: loc.profit + m.profit,
    });
  }

  const byWeek = Array.from(weekMap.values()).sort((a, b) => b.weekNumber - a.weekNumber);
  const byLocation = Array.from(locationMap.values()).sort((a, b) => b.profit - a.profit);

  const totals = byWeek.reduce(
    (acc, w) => ({
      collections: acc.collections + w.collections,
      postcardsSold: acc.postcardsSold + w.postcardsSold,
      revenue: acc.revenue + w.revenue,
      cost: acc.cost + w.cost,
      profit: acc.profit + w.profit,
    }),
    { ...ZERO_TOTALS }
  );

  return { byWeek, byLocation, totals, isEmpty: false };
}
