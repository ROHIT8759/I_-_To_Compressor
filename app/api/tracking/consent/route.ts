import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  extractGeoFromHeaders,
  getClientIp,
  getOrCreateVisitorId,
  getVisitorCookieMaxAgeSeconds,
  hashIpAddress,
  isSafeMetadata,
  VISITOR_COOKIE_NAME,
} from '@/lib/tracking';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      analyticsConsent?: boolean;
      source?: string;
      path?: string;
      timezone?: string;
      language?: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
    };

    if (typeof body.analyticsConsent !== 'boolean') {
      return NextResponse.json({ error: 'analyticsConsent must be a boolean.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { visitorId } = getOrCreateVisitorId(request);
    const geo = extractGeoFromHeaders(request);
    const ipHash = hashIpAddress(getClientIp(request));
    const userAgent = request.headers.get('user-agent');

    const { error } = await supabase.from('visitor_consents').upsert(
      {
        visitor_id: visitorId,
        analytics_consent: body.analyticsConsent,
        source: body.source ?? 'banner',
        path: body.path ?? null,
        country: geo.country,
        timezone: body.timezone ?? null,
        language: body.language ?? null,
        session_id: body.sessionId ?? null,
        ip_hash: ipHash,
        user_agent: userAgent,
        metadata: isSafeMetadata(body.metadata) ? body.metadata : {},
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'visitor_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: 'Failed to save consent.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, visitorId, analyticsConsent: body.analyticsConsent });
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getVisitorCookieMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error('Consent tracking error:', error);
    return NextResponse.json({ error: 'Failed to capture consent.' }, { status: 500 });
  }
}
