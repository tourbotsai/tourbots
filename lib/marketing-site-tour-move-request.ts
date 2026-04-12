import type { NextRequest } from 'next/server';

/**
 * Validates browser POSTs for marketing-site tour move tracking.
 * Requires Origin or Referer from an allowed host (production domain, localhost, Vercel preview).
 */
export function isMarketingSiteTourMoveOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const candidates = [origin, referer].filter((v): v is string => Boolean(v));

  const extra =
    process.env.MARKETING_SITE_MOVE_ALLOWED_HOSTS?.split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean) ?? [];

  const isAllowedHost = (host: string): boolean => {
    const h = host.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1') return true;
    if (h === 'tourbots.ai' || h === 'www.tourbots.ai') return true;
    if (h.endsWith('.vercel.app')) return true;
    if (extra.includes(h)) return true;
    return false;
  };

  for (const raw of candidates) {
    try {
      const host = new URL(raw).hostname;
      if (isAllowedHost(host)) return true;
    } catch {
      /* ignore */
    }
  }

  return false;
}

export function getMarketingSiteMoveGateConfig(): {
  embedId: string;
  venueId: string;
  tourId: string;
} | null {
  const embedId = process.env.NEXT_PUBLIC_MARKETING_SITE_EMBED_ID?.trim();
  const venueId = process.env.MARKETING_SITE_MOVE_TRACKING_VENUE_ID?.trim();
  const tourId = process.env.MARKETING_SITE_MOVE_TRACKING_TOUR_ID?.trim();

  if (!embedId || !venueId || !tourId) return null;

  return { embedId, venueId, tourId };
}

export function isMarketingSiteMoveGatedRequest(
  embedId: string,
  venueId: string,
  tourId: string | null | undefined
): boolean {
  const gate = getMarketingSiteMoveGateConfig();
  if (!gate) return false;
  if (embedId !== gate.embedId) return false;
  if (venueId !== gate.venueId) return false;
  if (!tourId || tourId !== gate.tourId) return false;
  return true;
}
