import { createHash, randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const VISITOR_COOKIE_NAME = 'compraser_vid';
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

export function getOrCreateVisitorId(request: NextRequest): { visitorId: string; isNew: boolean } {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value?.trim();
  if (existing) {
    return { visitorId: existing, isNew: false };
  }

  return { visitorId: randomUUID(), isNew: true };
}

export function getVisitorCookieMaxAgeSeconds() {
  return VISITOR_COOKIE_MAX_AGE_SECONDS;
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const candidates = ['x-real-ip', 'cf-connecting-ip', 'x-client-ip'];
  for (const headerName of candidates) {
    const value = request.headers.get(headerName)?.trim();
    if (value) return value;
  }

  return null;
}

export function hashIpAddress(ipAddress: string | null) {
  if (!ipAddress) return null;
  const salt = process.env.TRACKING_IP_HASH_SALT;
  if (!salt) return null;

  return createHash('sha256').update(`${salt}:${ipAddress}`).digest('hex');
}

export function extractGeoFromHeaders(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    request.headers.get('cloudfront-viewer-country') ??
    null;

  const region =
    request.headers.get('x-vercel-ip-country-region') ??
    request.headers.get('x-region') ??
    null;

  const city = request.headers.get('x-vercel-ip-city') ?? null;

  return {
    country,
    region,
    city,
  };
}

export function detectDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return 'unknown';
  const lower = userAgent.toLowerCase();

  if (lower.includes('bot') || lower.includes('crawl') || lower.includes('spider')) {
    return 'bot';
  }
  if (lower.includes('ipad') || lower.includes('tablet')) {
    return 'tablet';
  }
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    return 'mobile';
  }
  return 'desktop';
}

export function detectBrowser(userAgent: string | null) {
  if (!userAgent) return 'unknown';
  const lower = userAgent.toLowerCase();

  if (lower.includes('edg/')) return 'edge';
  if (lower.includes('chrome/')) return 'chrome';
  if (lower.includes('safari/') && !lower.includes('chrome/')) return 'safari';
  if (lower.includes('firefox/')) return 'firefox';
  if (lower.includes('opr/') || lower.includes('opera/')) return 'opera';

  return 'unknown';
}

export function detectOs(userAgent: string | null) {
  if (!userAgent) return 'unknown';
  const lower = userAgent.toLowerCase();

  if (lower.includes('windows')) return 'windows';
  if (lower.includes('mac os') || lower.includes('macintosh')) return 'macos';
  if (lower.includes('android')) return 'android';
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) return 'ios';
  if (lower.includes('linux')) return 'linux';

  return 'unknown';
}

export function isSafeMetadata(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  try {
    JSON.stringify(input);
    return true;
  } catch {
    return false;
  }
}
