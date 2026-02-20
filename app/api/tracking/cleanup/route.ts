import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const cronSecret = process.env.TRACKING_CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'TRACKING_CRON_SECRET is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const retentionDays = Number.parseInt(process.env.TRACKING_RETENTION_DAYS ?? '90', 10);
  const retentionMs = Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(Date.now() - retentionMs).toISOString();

  try {
    const supabase = getSupabaseAdmin();

    const { data: deletedEvents, error: eventsError } = await supabase
      .from('visitor_events')
      .delete()
      .lt('created_at', cutoffIso)
      .select('id');

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to clean visitor events.' }, { status: 500 });
    }

    const { data: deletedConsents, error: consentsError } = await supabase
      .from('visitor_consents')
      .delete()
      .lt('updated_at', cutoffIso)
      .select('id');

    if (consentsError) {
      return NextResponse.json({ error: 'Failed to clean visitor consents.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      retentionDays,
      cutoffIso,
      deletedEvents: deletedEvents?.length ?? 0,
      deletedConsents: deletedConsents?.length ?? 0,
    });
  } catch (error) {
    console.error('Tracking cleanup error:', error);
    return NextResponse.json({ error: 'Internal cleanup error.' }, { status: 500 });
  }
}
