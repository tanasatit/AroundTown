import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCollectionSchema, listCollectionsQuerySchema } from '@/lib/validations/collection';
import { calculateCollectionMetrics } from '@/lib/calculations';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createCollectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for duplicate collection
    const existing = await prisma.collection.findUnique({
      where: {
        collectionDate_roundNumber_machineLocation: {
          collectionDate: new Date(data.collectionDate),
          roundNumber: data.roundNumber,
          machineLocation: data.machineLocation,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A collection already exists for this date, round, and location' },
        { status: 409 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        collectionDate: new Date(data.collectionDate),
        roundNumber: data.roundNumber,
        weekNumber: data.weekNumber,
        machineLocation: data.machineLocation,
        machineCoins10baht: data.machineCoins10baht,
        exchangeCoins1baht: data.exchangeCoins1baht,
        exchangeCoins2baht: data.exchangeCoins2baht,
        exchangeCoins5baht: data.exchangeCoins5baht,
        exchangeCoins10baht: data.exchangeCoins10baht,
        exchangeNote20baht: data.exchangeNote20baht,
        exchangeNote50baht: data.exchangeNote50baht,
        exchangeNote100baht: data.exchangeNote100baht,
        exchangeNote500baht: data.exchangeNote500baht,
        exchangeNote1000baht: data.exchangeNote1000baht,
        postcardsRemaining: data.postcardsRemaining,
        costPerPostcard: data.costPerPostcard,
        notes: data.notes,
        createdBy: parseInt(session.user.id),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const calculations = calculateCollectionMetrics(collection);

    return NextResponse.json({ ...collection, ...calculations }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = listCollectionsQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      location: searchParams.get('location'),
      week: searchParams.get('week'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, limit, location, week, startDate, endDate } = queryResult.data;

    // Build where clause
    const where: {
      machineLocation?: { contains: string; mode: 'insensitive' };
      weekNumber?: number;
      collectionDate?: { gte?: Date; lte?: Date };
    } = {};

    if (location) {
      where.machineLocation = { contains: location, mode: 'insensitive' };
    }

    if (week) {
      where.weekNumber = week;
    }

    if (startDate || endDate) {
      where.collectionDate = {};
      if (startDate) {
        where.collectionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.collectionDate.lte = new Date(endDate);
      }
    }

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        orderBy: { collectionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.collection.count({ where }),
    ]);

    // Add calculations to each collection
    const collectionsWithCalculations = collections.map((collection) => ({
      ...collection,
      ...calculateCollectionMetrics(collection),
    }));

    return NextResponse.json({
      collections: collectionsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/collections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
