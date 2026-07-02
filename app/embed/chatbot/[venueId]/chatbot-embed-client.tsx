"use client";

import { useEffect, useRef, useState } from 'react';
import { Tour, Venue, ChatbotCustomisation } from '@/lib/types';
import { TourChatWidget } from '@/components/app/tours/tour-chat-widget';
import { getTourEmbedParentTrackingContext } from '@/lib/tour-embed-parent-context';
import { resolveChatButtonSizePx } from '@/lib/chat-button-size';

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
  // The host viewport size, relayed by chat.js. Inside a floating iframe our own
  // window.innerWidth is the iframe's width (tiny), which would make responsive
  // detection think it is always mobile — and wrongly request a fullscreen widget
  // that covers (and blocks clicks to) the whole host tour. In embed mode we assume
  // desktop until the host reports otherwise, to avoid that fullscreen flash.
  const [hostViewport, setHostViewport] = useState<{ width: number; height: number } | null>(null);
  const locationScopeTourId = tour.parent_tour_id || tour.id;

  const resolvedHostWidth =
    hostViewport?.width ??
    (mode === 'embed'
      ? 1024
      : typeof window !== 'undefined'
        ? window.innerWidth
        : 1024);

  // A chatbot-only iframe has no in-page Matterport SDK, so navigation must be
  // delivered to the host page (postMessage), where chat.js's bridge drives the
  // tour. When navigation is disabled, emit nothing.
  const navTarget: 'parent' | 'none' = navigationEnabled ? 'parent' : 'none';

  // Receive the host viewport from chat.js (posted on load + resize) and request it
  // on mount, so our responsive/fullscreen decisions reflect the real host page.
  useEffect(() => {
    if (mode !== 'embed') return;
    if (typeof window === 'undefined' || window.parent === window) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'tourbots-host' || data.type !== 'tourbots:viewport') return;
      if (typeof data.width === 'number' && typeof data.height === 'number' && data.width > 0) {
        setHostViewport({ width: data.width, height: data.height });
      }
    };
    window.addEventListener('message', onMessage);
    try {
      window.parent.postMessage({ source: 'tourbots', type: 'tourbots:request-viewport' }, '*');
    } catch {
      /* best-effort */
    }
    return () => window.removeEventListener('message', onMessage);
  }, [mode]);

  // Tell the host loader (chat.js) how large to make the floating iframe as the
  // widget opens/closes. Harmless for a plain inline iframe (no listener).
  useEffect(() => {
    if (mode !== 'embed') return;
    if (typeof window === 'undefined' || window.parent === window) return;

    // Use the host viewport width (not the iframe's) to decide mobile/fullscreen.
    const isMobile = resolvedHostWidth < 768;

    const position = customisation?.chat_button_position || 'bottom-right';

    // Read a numeric customisation value (with mobile fallback) or a default.
    const num = (desktopKey: string, mobileKey: string, fallback: number) => {
      const key = isMobile ? mobileKey : desktopKey;
      const raw = customisation ? Number((customisation as any)[key]) : NaN;
      return Number.isFinite(raw) && raw > 0 ? raw : fallback;
    };

    // Size the floating iframe to the widget's ACTUAL footprint (just the button
    // when collapsed, just the window when expanded) plus a small allowance for
    // its drop shadow. This keeps the transparent area around the widget
    // click-through to the host page's Matterport tour, mirroring how the in-page
    // tour embed behaves. (Previously the iframe reserved a large fixed box, which
    // swallowed clicks meant for the tour behind it.)
    const buttonSizePx = resolveChatButtonSizePx({
      pxValue: (customisation as any)?.[isMobile ? 'mobile_chat_button_size_px' : 'chat_button_size_px'],
      legacySize: (customisation as any)?.[isMobile ? 'mobile_chat_button_size' : 'chat_button_size'],
      mode: isMobile ? 'mobile' : 'desktop',
    });
    const buttonSideOffset = num('chat_button_side_offset', 'mobile_chat_button_side_offset', 20);
    const buttonBottomOffset = num('chat_button_bottom_offset', 'mobile_chat_button_bottom_offset', 20);
    const windowWidth = num('window_width', 'mobile_chat_window_width', 400);
    const windowHeight = num('window_height', 'mobile_chat_window_height', 600);
    const windowSideOffset = num('chat_offset_side', 'mobile_chat_offset_side', 20);
    const windowBottomOffset = num('chat_offset_bottom', 'mobile_chat_offset_bottom', 20);

    // Allowances cover the drop shadow (and idle button animation) so nothing is
    // clipped by the iframe's overflow:hidden.
    const BUTTON_ALLOWANCE = 44;
    const WINDOW_ALLOWANCE = 56;

    const payload = isChatExpanded
      ? {
          state: 'expanded' as const,
          width: isMobile ? null : windowWidth + windowSideOffset + WINDOW_ALLOWANCE,
          height: isMobile ? null : windowHeight + windowBottomOffset + WINDOW_ALLOWANCE,
          fullscreen: isMobile,
        }
      : {
          state: 'collapsed' as const,
          width: buttonSizePx + buttonSideOffset + BUTTON_ALLOWANCE,
          height: buttonSizePx + buttonBottomOffset + BUTTON_ALLOWANCE,
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
  }, [isChatExpanded, mode, customisation, resolvedHostWidth]);

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
    <>
      {/* The shared embed layout's body is bg-neutral-900 (globals.css). For a
          chatbot-only embed we want a transparent page so the floating widget sits
          over the host page (or shows cleanly in a standalone preview) instead of a
          black box. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `html, body, #__next { background: transparent !important; }`,
        }}
      />
      {/* TourChatWidget positions its button/window absolutely within its own
          `relative` wrapper, which collapses to height 0. In the full-tour embed a
          full-height Matterport sibling pushes that wrapper to the bottom of the
          viewport; here there is no such sibling, so we make the wrapper itself fill
          the viewport (h-screen) so the button anchors to the bottom corner. */}
      <TourChatWidget
        className="h-screen w-full"
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
        hostViewportWidth={mode === 'embed' ? resolvedHostWidth : null}
      />
    </>
  );
}
