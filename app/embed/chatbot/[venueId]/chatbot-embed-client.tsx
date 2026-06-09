"use client";

import { useEffect, useRef, useState } from 'react';
import { Tour, Venue, ChatbotCustomisation } from '@/lib/types';
import { TourChatWidget } from '@/components/app/tours/tour-chat-widget';
import { getTourEmbedParentTrackingContext } from '@/lib/tour-embed-parent-context';

interface ChatbotEmbedClientProps {
  tour: Tour;
  venue: Venue;
  customisation: ChatbotCustomisation | null;
  chatbotConfig?: { chatbot_name: string; welcome_message: string; is_active: boolean } | null;
  embedId: string;
  embedToken?: string | null;
  navigationEnabled: boolean;
  // 'embed'  → injected by chat.js as a floating widget (size relayed to the host).
  // 'iframe' → a plain inline <iframe> the operator placed themselves.
  mode: 'embed' | 'iframe';
}

export function ChatbotEmbedClient({
  tour,
  venue,
  customisation,
  chatbotConfig,
  embedId,
  embedToken,
  navigationEnabled,
  mode,
}: ChatbotEmbedClientProps) {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const locationScopeTourId = tour.parent_tour_id || tour.id;

  // A chatbot-only iframe has no in-page Matterport SDK, so navigation must be
  // delivered to the host page (postMessage), where chat.js's bridge drives the
  // tour. When navigation is disabled, emit nothing.
  const navTarget: 'parent' | 'none' = navigationEnabled ? 'parent' : 'none';

  // Tell the host loader (chat.js) how large to make the floating iframe as the
  // widget opens/closes. Harmless for a plain inline iframe (no listener).
  useEffect(() => {
    if (mode !== 'embed') return;
    if (typeof window === 'undefined' || window.parent === window) return;

    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches;

    const position = customisation?.chat_button_position || 'bottom-right';
    const windowWidth = Number(customisation?.window_width) || 400;
    const windowHeight = Number(customisation?.window_height) || 600;

    const payload = isChatExpanded
      ? {
          state: 'expanded' as const,
          width: isMobile ? null : windowWidth + 48,
          height: isMobile ? null : windowHeight + 112,
          fullscreen: isMobile,
        }
      : {
          state: 'collapsed' as const,
          width: 360,
          height: 168,
          fullscreen: false,
        };

    try {
      window.parent.postMessage(
        { source: 'tourbots', type: 'tourbots:size', position, ...payload },
        '*'
      );
    } catch {
      /* best-effort cross-origin size relay */
    }
  }, [isChatExpanded, mode, customisation]);

  // Track an embed view (chatbot type). Same-origin to tourbots.ai, so no CORS.
  useEffect(() => {
    const ctx = getTourEmbedParentTrackingContext();
    if (!ctx) return;

    void fetch('/api/public/embed/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedId,
        venueId: venue.id,
        type: 'chatbot',
        chatbotType: 'tour',
        domain: ctx.domain,
        pageUrl: ctx.pageUrl,
        modelId: tour.matterport_tour_id,
        tourId: locationScopeTourId,
      }),
    }).catch(() => {
      /* non-blocking analytics */
    });
  }, [embedId, venue.id, tour.matterport_tour_id, locationScopeTourId]);

  // Move tracking: chat.js's bridge subscribes to the host tour's pose and relays
  // sweep changes here, so moves are recorded same-origin (avoids cross-origin POST).
  const lastSweepRef = useRef<string | null>(null);
  useEffect(() => {
    if (!navigationEnabled) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'tourbots-host' || data.type !== 'tourbots:pose') {
        return;
      }
      const sweepId = typeof data.sweepId === 'string' ? data.sweepId : null;
      if (!sweepId || sweepId === lastSweepRef.current) return;
      lastSweepRef.current = sweepId;

      const ctx = getTourEmbedParentTrackingContext();

      void fetch('/api/public/embed/track-tour-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedId,
          venueId: venue.id,
          tourId: locationScopeTourId,
          sweepId,
          position: data.position ?? null,
          rotation: data.rotation ?? null,
          domain: ctx?.domain ?? null,
          pageUrl: ctx?.pageUrl ?? null,
          matterportModelId: tour.matterport_tour_id,
        }),
      }).catch(() => {
        /* non-blocking analytics */
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigationEnabled, embedId, venue.id, locationScopeTourId, tour.matterport_tour_id]);

  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <TourChatWidget
        venueId={venue.id}
        venueName={venue.name}
        tour={tour}
        scopeTourId={locationScopeTourId}
        customisation={customisation}
        initialConfig={chatbotConfig ?? undefined}
        isFullscreen={false}
        isExpanded={isChatExpanded}
        onToggle={setIsChatExpanded}
        embedId={embedId}
        embedToken={embedToken || undefined}
        forcePublic
        navTarget={navTarget}
      />
    </div>
  );
}
