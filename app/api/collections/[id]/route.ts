import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCollectionSchema } from '@/lib/validations/collection';
import { calculateCollectionMetrics } from '@/lib/calculations';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const calculations = calculateCollectionMetrics(collection);

    return NextResponse.json({ ...collection, ...calculations });
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = updateCollectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for duplicate if date, round, or location is being updated
    if (data.collectionDate || data.roundNumber || data.machineLocation) {
      const duplicateCheck = await prisma.collection.findFirst({
        where: {
          id: { not: collectionId },
          collectionDate: data.collectionDate ? new Date(data.collectionDate) : existing.collectionDate,
          roundNumber: data.roundNumber ?? existing.roundNumber,
          machineLocation: data.machineLocation ?? existing.machineLocation,
        },
      });

      if (duplicateCheck) {
        return NextResponse.json(
          { error: 'A collection already exists for this date, round, and location' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.collectionDate !== undefined) updateData.collectionDate = new Date(data.collectionDate);
    if (data.roundNumber !== undefined) updateData.roundNumber = data.roundNumber;
    if (data.weekNumber !== undefined) updateData.weekNumber = data.weekNumber;
    if (data.machineLocation !== undefined) updateData.machineLocation = data.machineLocation;
    if (data.machineCoins10baht !== undefined) updateData.machineCoins10baht = data.machineCoins10baht;
    if (data.exchangeCoins1baht !== undefined) updateData.exchangeCoins1baht = data.exchangeCoins1baht;
    if (data.exchangeCoins2baht !== undefined) updateData.exchangeCoins2baht = data.exchangeCoins2baht;
    if (data.exchangeCoins5baht !== undefined) updateData.exchangeCoins5baht = data.exchangeCoins5baht;
    if (data.exchangeCoins10baht !== undefined) updateData.exchangeCoins10baht = data.exchangeCoins10baht;
    if (data.exchangeNote20baht !== undefined) updateData.exchangeNote20baht = data.exchangeNote20baht;
    if (data.exchangeNote50baht !== undefined) updateData.exchangeNote50baht = data.exchangeNote50baht;
    if (data.exchangeNote100baht !== undefined) updateData.exchangeNote100baht = data.exchangeNote100baht;
    if (data.exchangeNote500baht !== undefined) updateData.exchangeNote500baht = data.exchangeNote500baht;
    if (data.exchangeNote1000baht !== undefined) updateData.exchangeNote1000baht = data.exchangeNote1000baht;
    if (data.postcardsRemaining !== undefined) updateData.postcardsRemaining = data.postcardsRemaining;
    if (data.costPerPostcard !== undefined) updateData.costPerPostcard = data.costPerPostcard;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const calculations = calculateCollectionMetrics(collection);

    return NextResponse.json({ ...collection, ...calculations });
  } catch (error) {
    console.error('PUT /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return NextResponse.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
