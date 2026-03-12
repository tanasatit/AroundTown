import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRefillSchema, listRefillsQuerySchema } from '@/lib/validations/refill';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createRefillSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { refillDate, machineLocation, postcardsAdded, postcardsBefore, notes } = result.data;
    const postcardsAfter = postcardsBefore + postcardsAdded;

    const refill = await prisma.refill.create({
      data: {
        refillDate: new Date(refillDate),
        machineLocation,
        postcardsAdded,
        postcardsBefore,
        postcardsAfter,
        notes,
        createdBy: parseInt(session.user.id),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(refill, { status: 201 });
  } catch (error) {
    console.error('POST /api/refills error:', error);
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
    const queryResult = listRefillsQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      location: searchParams.get('location'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, limit, location, startDate, endDate } = queryResult.data;

    const where: {
      machineLocation?: { contains: string; mode: 'insensitive' };
      refillDate?: { gte?: Date; lte?: Date };
    } = {};

    if (location) {
      where.machineLocation = { contains: location, mode: 'insensitive' };
    }
    if (startDate || endDate) {
      where.refillDate = {};
      if (startDate) where.refillDate.gte = new Date(startDate);
      if (endDate)   where.refillDate.lte = new Date(endDate);
    }

    const [refills, total] = await Promise.all([
      prisma.refill.findMany({
        where,
        orderBy: { refillDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.refill.count({ where }),
    ]);

    return NextResponse.json({
      refills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/refills error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
