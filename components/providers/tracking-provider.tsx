'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type ConsentState = 'granted' | 'denied' | 'unknown';

const CONSENT_STORAGE_KEY = 'compraser_analytics_consent';
const SESSION_STORAGE_KEY = 'compraser_session_id';

function getSessionId() {
  if (typeof window === 'undefined') return null;
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function getTrackingContext() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    deviceMemory?: number;
  };

  const url = new URL(window.location.href);
  const colorScheme = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return {
    sessionId: getSessionId(),
    url: window.location.href,
    pageTitle: document.title || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    language: navigator.language || null,
    languages: navigator.languages ?? [],
    platform: navigator.platform || null,
    userAgent: navigator.userAgent || null,
    doNotTrack: navigator.doNotTrack === '1',
    colorScheme,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen?.width ?? null,
    screenHeight: window.screen?.height ?? null,
    devicePixelRatio: window.devicePixelRatio || null,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGb: nav.deviceMemory ?? null,
    networkEffectiveType: nav.connection?.effectiveType ?? null,
    networkDownlinkMbps: nav.connection?.downlink ?? null,
    networkRttMs: nav.connection?.rtt ?? null,
    utmSource: url.searchParams.get('utm_source'),
    utmMedium: url.searchParams.get('utm_medium'),
    utmCampaign: url.searchParams.get('utm_campaign'),
    utmTerm: url.searchParams.get('utm_term'),
    utmContent: url.searchParams.get('utm_content'),
  };
}

async function sendConsent(analyticsConsent: boolean, source: string, path: string) {
  const context = getTrackingContext();
  await fetch('/api/tracking/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analyticsConsent,
      source,
      path,
      timezone: context.timezone ?? null,
      language: context.language ?? null,
      sessionId: context.sessionId ?? null,
      metadata: context,
    }),
  });
}

async function sendPageView(path: string) {
  const context = getTrackingContext();
  await fetch('/api/tracking/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'page_view',
      path,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      timezone: context.timezone ?? null,
      language: context.language ?? null,
      sessionId: context.sessionId ?? null,
      url: context.url ?? null,
      pageTitle: context.pageTitle ?? null,
      utmSource: context.utmSource ?? null,
      utmMedium: context.utmMedium ?? null,
      utmCampaign: context.utmCampaign ?? null,
      utmTerm: context.utmTerm ?? null,
      utmContent: context.utmContent ?? null,
      viewportWidth: context.viewportWidth ?? null,
      viewportHeight: context.viewportHeight ?? null,
      screenWidth: context.screenWidth ?? null,
      screenHeight: context.screenHeight ?? null,
      devicePixelRatio: context.devicePixelRatio ?? null,
      doNotTrack: context.doNotTrack ?? null,
      colorScheme: context.colorScheme ?? null,
      platform: context.platform ?? null,
      hardwareConcurrency: context.hardwareConcurrency ?? null,
      deviceMemoryGb: context.deviceMemoryGb ?? null,
      networkEffectiveType: context.networkEffectiveType ?? null,
      networkDownlinkMbps: context.networkDownlinkMbps ?? null,
      networkRttMs: context.networkRttMs ?? null,
      metadata: context,
    }),
  });
}

// Inner component that uses useSearchParams – must be wrapped in <Suspense>
function TrackingProviderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState<ConsentState>('unknown');
  const hasSyncedConsent = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      setConsent(stored);
      return;
    }

    setConsent('unknown');
  }, []);

  useEffect(() => {
    if (consent === 'unknown' || hasSyncedConsent.current) return;

    hasSyncedConsent.current = true;
    void sendConsent(consent === 'granted', 'stored_preference', currentPath).catch((error) => {
      console.error('Failed to sync tracking consent:', error);
      hasSyncedConsent.current = false;
    });
  }, [consent, currentPath]);

  useEffect(() => {
    if (consent !== 'granted') return;
    if (!currentPath || lastTrackedPath.current === currentPath) return;

    lastTrackedPath.current = currentPath;
    void sendPageView(currentPath).catch((error) => {
      console.error('Failed to track page view:', error);
    });
  }, [consent, currentPath]);

  const updateConsent = async (nextConsent: Exclude<ConsentState, 'unknown'>) => {
    setConsent(nextConsent);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, nextConsent);
    }

    try {
      await sendConsent(nextConsent === 'granted', 'banner', currentPath);
      if (nextConsent === 'granted') {
        await sendPageView(currentPath);
      }
    } catch (error) {
      console.error('Failed to update tracking consent:', error);
    }
  };

  if (consent !== 'unknown') {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-white/15 bg-slate-900/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur">
      <p className="leading-relaxed text-slate-200">
        We use privacy-safe analytics (country-level only, hashed IP, no raw IP storage) to improve this site.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void updateConsent('denied')}
          className="rounded-md border border-slate-500/40 px-3 py-1.5 text-slate-200 transition hover:bg-slate-700/40"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => void updateConsent('granted')}
          className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white transition hover:bg-indigo-500"
        >
          Allow analytics
        </button>
      </div>
    </div>
  );
}

// Outer component wraps the inner one in Suspense so Next.js can statically
// prerender pages that contain this provider (required for useSearchParams).
export default function TrackingProvider() {
  return (
    <Suspense fallback={null}>
      <TrackingProviderInner />
    </Suspense>
  );
}
