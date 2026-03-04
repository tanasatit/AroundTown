import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateCollectionMetrics } from '@/lib/calculations';

export type CollectionRow = Awaited<ReturnType<typeof getCollections>>['collections'][number];

export interface GetCollectionsParams {
  page?: number;
  location?: string;
  week?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: string;
}

const LIMIT = 10;

export async function getCollections(params: GetCollectionsParams = {}) {
  const {
    page = 1,
    location,
    week,
    startDate,
    endDate,
    sort = 'date',
    order = 'desc',
  } = params;

  const sortOrder = (order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const orderByMap = {
    date:    { collectionDate: sortOrder },
    week:    { weekNumber: sortOrder },
    revenue: { machineCoins10baht: sortOrder },
    profit:  { machineCoins10baht: sortOrder },
  };

  const orderBy = orderByMap[sort as keyof typeof orderByMap] ?? { collectionDate: 'desc' as const };

  const where: Prisma.CollectionWhereInput = {};

  if (location) {
    where.machineLocation = { contains: location, mode: 'insensitive' };
  }
  if (week) {
    where.weekNumber = Number(week);
  }
  if (startDate || endDate) {
    where.collectionDate = {};
    if (startDate) where.collectionDate.gte = new Date(startDate);
    if (endDate)   where.collectionDate.lte = new Date(endDate);
  }

  const [rows, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.collection.count({ where }),
  ]);

  const collections = rows.map((row) => ({
    ...row,
    ...calculateCollectionMetrics(row),
    costPerPostcard: Number(row.costPerPostcard),
  }));

  return {
    collections,
    pagination: {
      page,
      limit: LIMIT,
      total,
      totalPages: Math.ceil(total / LIMIT),
    },
  };
}
