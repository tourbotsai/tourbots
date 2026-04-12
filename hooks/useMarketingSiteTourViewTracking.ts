"use client";

import { useEffect } from "react";

/**
 * Records a tour embed view for the marketing homepage demo when `embedId` is set
 * (NEXT_PUBLIC_MARKETING_SITE_EMBED_ID). Server enforces venue/tour allowlist and Origin
 * (same gate as useMarketingSiteTourMoveTracking).
 */
export function useMarketingSiteTourViewTracking(opts: {
  embedId: string | undefined;
  venueId: string;
  scopeTourId: string | null | undefined;
  currentModelId: string;
  enabled: boolean;
}) {
  const { embedId, venueId, scopeTourId, currentModelId, enabled } = opts;

  useEffect(() => {
    if (!enabled || !embedId || !venueId || !scopeTourId || !currentModelId) return;

    void fetch("/api/public/embed/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embedId,
        venueId,
        type: "tour",
        domain: typeof window !== "undefined" ? window.location.hostname : undefined,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        tourId: scopeTourId,
      }),
    }).catch(() => {
      /* non-blocking analytics */
    });
  }, [enabled, embedId, venueId, scopeTourId, currentModelId]);
}
