import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRefillSchema } from '@/lib/validations/refill';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const refill = await prisma.refill.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!refill) {
      return NextResponse.json({ error: 'Refill not found' }, { status: 404 });
    }

    return NextResponse.json(refill);
  } catch (error) {
    console.error('GET /api/refills/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.refill.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Refill not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateRefillSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Recalculate postcardsAfter if relevant fields changed
    const postcardsBefore = data.postcardsBefore ?? existing.postcardsBefore;
    const postcardsAdded  = data.postcardsAdded  ?? existing.postcardsAdded;
    const postcardsAfter  = postcardsBefore + postcardsAdded;

    const refill = await prisma.refill.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.refillDate      && { refillDate: new Date(data.refillDate) }),
        ...(data.machineLocation && { machineLocation: data.machineLocation }),
        ...(data.postcardsAdded  !== undefined && { postcardsAdded }),
        ...(data.postcardsBefore !== undefined && { postcardsBefore }),
        postcardsAfter,
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(refill);
  } catch (error) {
    console.error('PUT /api/refills/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.refill.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Refill not found' }, { status: 404 });
    }

    await prisma.refill.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Refill deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/refills/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
