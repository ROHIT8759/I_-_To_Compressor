import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('web_vitals_metrics').insert({
      metric_id: body.id ?? null,
      metric_name: body.name,
      metric_value: body.value,
      rating: body.rating ?? null,
      delta: body.delta ?? null,
      navigation_type: body.navigationType ?? null,
      page_path: body.page ?? null,
      referrer: request.headers.get('referer'),
      user_agent: request.headers.get('user-agent'),
    });

    if (error) {
      console.error('Metrics DB insert error:', error);
      return NextResponse.json({ error: 'Failed to persist metrics.' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Metrics capture error:', error);
    return NextResponse.json({ error: 'Failed to capture metrics.' }, { status: 500 });
  }
}
