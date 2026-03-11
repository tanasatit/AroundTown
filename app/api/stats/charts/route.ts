import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChartData } from '@/lib/stats';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getChartData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/stats/charts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
