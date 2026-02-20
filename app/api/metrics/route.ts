import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type MetricPayload = {
  id?: string;
  name?: string;
  value?: number;
  rating?: 'good' | 'needs-improvement' | 'poor' | null;
  delta?: number | null;
  navigationType?: string | null;
  page?: string | null;
  ts?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MetricPayload;

    if (!body?.name || typeof body.value !== 'number') {
      return NextResponse.json({ error: 'Invalid metric payload.' }, { status: 400 });
    }

    // Replace this with your analytics sink (DB, queue, APM, etc.).
    console.info('[web-vitals]', {
      id: body.id ?? null,
      name: body.name,
      value: body.value,
      rating: body.rating ?? null,
      delta: body.delta ?? null,
      navigationType: body.navigationType ?? null,
      page: body.page ?? null,
      ts: body.ts ?? Date.now(),
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Metrics capture error:', error);
    return NextResponse.json({ error: 'Failed to capture metrics.' }, { status: 500 });
  }
}
