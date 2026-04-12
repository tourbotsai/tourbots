"use client";

import { useEffect, useRef, useCallback } from "react";
import { normaliseMatterportPoseForTracking } from "@/lib/matterport-pose-normalise";

type SweepLike = { sid?: string } | null;

/**
 * Records Matterport sweep changes for the marketing homepage tour only when `embedId` is set
 * (NEXT_PUBLIC_MARKETING_SITE_EMBED_ID). Server enforces venue/tour allowlist and Origin.
 *
 * Moves are only counted after the user engages with the tour iframe (focus), so autoplay / guided
 * sweep changes before that are excluded. The SDK does not expose user vs programmatic navigation.
 */
export function useMarketingSiteTourMoveTracking(opts: {
  embedId: string | undefined;
  venueId: string;
  scopeTourId: string | null | undefined;
  currentSweep: SweepLike;
  currentModelId: string;
  enabled: boolean;
}) {
  const { embedId, venueId, scopeTourId, currentSweep, currentModelId, enabled } = opts;

  const poseRef = useRef<unknown>(null);
  const lastSweepSidRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const engagedRef = useRef(false);
  const currentSweepRef = useRef(currentSweep);
  useEffect(() => {
    currentSweepRef.current = currentSweep;
  }, [currentSweep]);

  const onPoseChange = useCallback((pose: unknown) => {
    poseRef.current = pose;
  }, []);

  const onUserEngaged = useCallback(() => {
    if (engagedRef.current) return;
    engagedRef.current = true;
    const sid = currentSweepRef.current?.sid;
    lastSweepSidRef.current = typeof sid === "string" ? sid : null;
  }, []);

  useEffect(() => {
    generationRef.current += 1;
    lastSweepSidRef.current = null;
    engagedRef.current = false;
  }, [currentModelId]);

  useEffect(() => {
    if (!enabled || !embedId || !venueId || !scopeTourId || !currentSweep?.sid) return;

    const generation = generationRef.current;
    const sid = currentSweep.sid as string;
    const modelId = currentModelId;
    if (!modelId) return;

    const timer = window.setTimeout(() => {
      if (generation !== generationRef.current) return;

      if (lastSweepSidRef.current === null) {
        lastSweepSidRef.current = sid;
        return;
      }
      if (lastSweepSidRef.current === sid) return;
      lastSweepSidRef.current = sid;

      if (!engagedRef.current) {
        return;
      }

      const { position, rotation } = normaliseMatterportPoseForTracking(poseRef.current);

      void fetch("/api/public/embed/track-tour-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedId,
          venueId,
          tourId: scopeTourId,
          sweepId: sid,
          position,
          rotation,
          domain: typeof window !== "undefined" ? window.location.hostname : null,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          matterportModelId: modelId,
        }),
      }).catch(() => {
        /* non-blocking analytics */
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [enabled, embedId, venueId, scopeTourId, currentSweep, currentModelId]);

  return { onPoseChange, onUserEngaged };
}
