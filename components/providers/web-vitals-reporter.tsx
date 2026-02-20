'use client';

import { useReportWebVitals } from 'next/web-vitals';

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navigationType?: string;
};

export default function WebVitalsReporter() {
  useReportWebVitals((metric: WebVitalMetric) => {
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      return;
    }

    const payload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating ?? null,
      delta: metric.delta ?? null,
      navigationType: metric.navigationType ?? null,
      page: typeof window !== 'undefined' ? window.location.pathname : null,
      ts: Date.now(),
    };

    const body = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/metrics', blob);
      return;
    }

    void fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  });

  return null;
}
