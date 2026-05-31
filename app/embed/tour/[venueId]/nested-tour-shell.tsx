"use client";

import { useEffect, useState } from 'react';

interface NestedTourShellProps {
  venueId: string;
  canonicalOrigin: string;
  /** Query params received by the shell (id, tourId, showTitle, showChat, model, domain, pageUrl). */
  searchParams: Record<string, string | undefined>;
}

/** Params forwarded verbatim to the canonical inner embed. */
const FORWARDED_PARAM_KEYS = ['id', 'tourId', 'showTitle', 'showChat', 'model'] as const;

/**
 * Builds the canonical inner embed URL. Forwards the tour params and the real
 * parent page context (domain/pageUrl) so analytics attribute to the host site
 * rather than the white-label shell. The parent context is taken from the
 * incoming params first (script embed forwards it), falling back to the shell's
 * own referrer (static iframe embed) which is the real client page.
 */
function buildInnerSrc(
  venueId: string,
  canonicalOrigin: string,
  searchParams: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();

  for (const key of FORWARDED_PARAM_KEYS) {
    const value = searchParams[key];
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  }

  let domain = searchParams.domain;
  let pageUrl = searchParams.pageUrl;

  if ((!domain || !pageUrl) && typeof document !== 'undefined' && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (!domain) domain = referrer.hostname;
      if (!pageUrl) pageUrl = document.referrer;
    } catch {
      /* ignore malformed referrer */
    }
  }

  if (domain) params.set('domain', domain);
  if (pageUrl) params.set('pageUrl', pageUrl);

  const query = params.toString();
  return `${canonicalOrigin}/embed/tour/${venueId}${query ? `?${query}` : ''}`;
}

/**
 * White-label shell: nests the canonical tourbots tour embed in a full-bleed
 * iframe. The inner frame runs on the canonical origin, so the Matterport SDK
 * is authorised and the chat route treats it as first-party — navigation,
 * chat and analytics all work on any custom domain with no per-domain setup.
 *
 * The tour embed is fixed-height (the host iframe sets the height), so the
 * inner frame simply fills 100% and no height relay is required.
 */
export function NestedTourShell({ venueId, canonicalOrigin, searchParams }: NestedTourShellProps) {
  // Compute on the client where document.referrer is available; fall back to a
  // referrer-less URL during SSR (replaced on hydration before first paint).
  const [src, setSrc] = useState(() => buildInnerSrc(venueId, canonicalOrigin, searchParams));

  useEffect(() => {
    setSrc(buildInnerSrc(venueId, canonicalOrigin, searchParams));
  }, [venueId, canonicalOrigin, searchParams]);

  return (
    <iframe
      src={src}
      title="Virtual tour"
      style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
      allowFullScreen
      allow="xr-spatial-tracking; gyroscope; accelerometer; autoplay; fullscreen"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
