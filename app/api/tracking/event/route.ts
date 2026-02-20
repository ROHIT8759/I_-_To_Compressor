import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  detectBrowser,
  detectDeviceType,
  detectOs,
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
      eventName?: string;
      path?: string;
      referrer?: string;
      timezone?: string;
      language?: string;
      sessionId?: string;
      url?: string;
      pageTitle?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      viewportWidth?: number;
      viewportHeight?: number;
      screenWidth?: number;
      screenHeight?: number;
      devicePixelRatio?: number;
      doNotTrack?: boolean;
      colorScheme?: string;
      platform?: string;
      hardwareConcurrency?: number;
      deviceMemoryGb?: number;
      networkEffectiveType?: string;
      networkDownlinkMbps?: number;
      networkRttMs?: number;
      metadata?: Record<string, unknown>;
    };

    if (!body.eventName || typeof body.eventName !== 'string') {
      return NextResponse.json({ error: 'eventName is required.' }, { status: 400 });
    }

    const { visitorId } = getOrCreateVisitorId(request);
    const supabase = getSupabaseAdmin();

    const { data: consent, error: consentError } = await supabase
      .from('visitor_consents')
      .select('analytics_consent')
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (consentError) {
      return NextResponse.json({ error: 'Failed to verify consent.' }, { status: 500 });
    }

    if (!consent?.analytics_consent) {
      const skippedResponse = NextResponse.json({ tracked: false, reason: 'analytics_consent_missing' }, { status: 202 });
      skippedResponse.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: getVisitorCookieMaxAgeSeconds(),
      });
      return skippedResponse;
    }

    const geo = extractGeoFromHeaders(request);
    const userAgent = request.headers.get('user-agent');
    const ipHash = hashIpAddress(getClientIp(request));

    const { error: insertError } = await supabase.from('visitor_events').insert({
      visitor_id: visitorId,
      event_name: body.eventName,
      path: body.path ?? null,
      referrer: body.referrer ?? request.headers.get('referer') ?? null,
      session_id: body.sessionId ?? null,
      url: body.url ?? null,
      page_title: body.pageTitle ?? null,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: body.timezone ?? null,
      language: body.language ?? null,
      utm_source: body.utmSource ?? null,
      utm_medium: body.utmMedium ?? null,
      utm_campaign: body.utmCampaign ?? null,
      utm_term: body.utmTerm ?? null,
      utm_content: body.utmContent ?? null,
      device_type: detectDeviceType(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOs(userAgent),
      viewport_width: Number.isFinite(body.viewportWidth) ? body.viewportWidth : null,
      viewport_height: Number.isFinite(body.viewportHeight) ? body.viewportHeight : null,
      screen_width: Number.isFinite(body.screenWidth) ? body.screenWidth : null,
      screen_height: Number.isFinite(body.screenHeight) ? body.screenHeight : null,
      device_pixel_ratio: Number.isFinite(body.devicePixelRatio) ? body.devicePixelRatio : null,
      do_not_track: typeof body.doNotTrack === 'boolean' ? body.doNotTrack : null,
      color_scheme: body.colorScheme ?? null,
      platform: body.platform ?? null,
      hardware_concurrency: Number.isFinite(body.hardwareConcurrency) ? body.hardwareConcurrency : null,
      device_memory_gb: Number.isFinite(body.deviceMemoryGb) ? body.deviceMemoryGb : null,
      network_effective_type: body.networkEffectiveType ?? null,
      network_downlink_mbps: Number.isFinite(body.networkDownlinkMbps) ? body.networkDownlinkMbps : null,
      network_rtt_ms: Number.isFinite(body.networkRttMs) ? body.networkRttMs : null,
      ip_hash: ipHash,
      metadata: isSafeMetadata(body.metadata) ? body.metadata : {},
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to store event.' }, { status: 500 });
    }

    const response = NextResponse.json({ tracked: true, visitorId });
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getVisitorCookieMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json({ error: 'Failed to store event.' }, { status: 500 });
  }
}
