"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TourMenuSettings, TourMenuBlock } from "@/lib/types";
import { TourMenuWidget } from "./tour-menu-widget";
import { TourMenuRenderer, TourMenuActivatedItem } from "./tour-menu-renderer";
import { getEffectiveMenuChrome, MenuTriggerSource, MenuItemAction } from "@/lib/tour-menu";
import { getTourEmbedParentTrackingContext } from "@/lib/tour-embed-parent-context";

type TourMenuData = { settings: TourMenuSettings | null; blocks: TourMenuBlock[] };
type EmbedMenuEventType = 'menu_opened' | 'menu_closed' | 'menu_item_clicked' | 'menu_ai_prompt_sent';

interface TourMenuOverlayProps {
  tourId: string;
  onClose?: () => void;
  isPreviewMode?: boolean; // Admin preview mode - bypasses session storage
  isTourReady?: boolean; // SDK ready state - disables navigation until ready
  onOpenChat?: (opts?: { prompt?: string; autoSend?: boolean }) => void; // Open the chat widget, optionally with a predefined prompt
  isChatAvailable?: boolean; // Whether chat widget is enabled
  currentModelId?: string; // Current active model ID - prevents redundant switches
  initialMenuData?: TourMenuData | null; // SSR-provided menu data for instant first paint
  // Present on the production tour embed (not the app preview/portal) - enables menu analytics.
  venueId?: string;
  embedId?: string;
  embedToken?: string | null;
}

export function TourMenuOverlay({
  tourId,
  onClose,
  isPreviewMode = false,
  isTourReady = true,
  onOpenChat,
  isChatAvailable = false,
  currentModelId,
  initialMenuData,
  venueId,
  embedId,
  embedToken,
}: TourMenuOverlayProps) {
  const [menuData, setMenuData] = useState<TourMenuData | null>(initialMenuData ?? null);
  const [isVisible, setIsVisible] = useState(false);
  // When SSR data is present we are not loading on first paint.
  const [isLoading, setIsLoading] = useState(!initialMenuData);
  const [showWidget, setShowWidget] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Tracks whether the SSR-provided data has already been applied, so we only use it on the
  // very first mount and fall back to fetching when the scope tour changes afterwards.
  const initialDataConsumedRef = useRef(false);

  // Fires a menu analytics event. Takes the settings/mobile flag as explicit params (rather
  // than reading them off state) so callers right after a setState still report accurately.
  const sendMenuEvent = useCallback(
    (
      eventType: EmbedMenuEventType,
      settingsForChrome: TourMenuSettings | Record<string, any> | null | undefined,
      mobileFlag: boolean,
      extra: {
        triggerSource?: MenuTriggerSource;
        itemId?: string;
        itemLabel?: string;
        itemType?: string;
        actionType?: string;
        targetRef?: string | null;
      } = {}
    ) => {
      if (!venueId || !embedId || !embedToken || isPreviewMode || !settingsForChrome) return;

      const chrome = getEffectiveMenuChrome(settingsForChrome, mobileFlag ? 'mobile' : 'desktop');
      const ctx = getTourEmbedParentTrackingContext();

      void fetch('/api/public/embed/track-menu-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedId,
          embedToken,
          venueId,
          tourId,
          eventType,
          menuStyle: chrome.menuStyle,
          domain: ctx?.domain ?? null,
          pageUrl: ctx?.pageUrl ?? null,
          ...extra,
        }),
      }).catch(() => {
        /* non-blocking analytics */
      });
    },
    [venueId, embedId, embedToken, isPreviewMode, tourId]
  );

  useEffect(() => {
    let cancelled = false;

    // Apply a resolved menu payload to visibility state (shared by SSR + fetch paths).
    function applyMenuData(data: TourMenuData | null) {
      if (data?.settings?.enabled) {
        setMenuData(data);

        // Read the viewport directly rather than the isMobile state, which may not have
        // been set by its own effect yet on this very first render.
        const mobileNow = typeof window !== 'undefined' && window.innerWidth < 768;
        const chrome = getEffectiveMenuChrome(data.settings, mobileNow ? 'mobile' : 'desktop');

        // Check if menu was already dismissed this session (skip in preview mode)
        const dismissed = !isPreviewMode && sessionStorage.getItem(`tour-menu-dismissed-${tourId}`);

        if (dismissed || !chrome.startOpen) {
          // Menu was dismissed, or configured to start closed - show the trigger/widget instead.
          setIsVisible(false);
          setShowWidget(true);
        } else {
          // Show menu on first load
          setIsVisible(true);
          setShowWidget(false);
          sendMenuEvent('menu_opened', data.settings, mobileNow, { triggerSource: 'auto_open' });
        }
      } else {
        // Explicitly keep hidden if this tour has no enabled menu.
        setMenuData(null);
        setIsVisible(false);
        setShowWidget(false);
      }
    }

    async function fetchMenu() {
      // Hard reset overlay state whenever scope tour changes.
      setIsLoading(true);
      setMenuData(null);
      setIsVisible(false);
      setShowWidget(false);

      try {
        // Fetch menu data regardless of dismissed state (we need it for the widget)
        const response = await fetch(`/api/public/menu/${tourId}`);

        if (!response.ok) {
          // Silently fail if API returns error - don't break the embed
          if (!cancelled) setIsLoading(false);
          return;
        }

        const data = await response.json();
        if (cancelled) return;

        applyMenuData(data);
      } catch (error) {
        // Silently fail - tour should still work even if menu fails to load
        console.error('Error fetching tour menu:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (!tourId) {
      return () => {
        cancelled = true;
      };
    }

    // 🚀 SPEED: on first mount use SSR-provided menu data so the overlay paints instantly,
    // with no client round trip after hydration. Subsequent scope changes still fetch.
    if (initialMenuData && !initialDataConsumedRef.current) {
      initialDataConsumedRef.current = true;
      setIsLoading(false);
      applyMenuData(initialMenuData);
      return () => {
        cancelled = true;
      };
    }

    fetchMenu();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, isPreviewMode, initialMenuData]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClose = useCallback(
    (triggerSource: MenuTriggerSource = 'close_control') => {
      setIsVisible(false);

      // Show widget after menu close animation completes
      setTimeout(() => {
        setShowWidget(true);
      }, 300); // Wait for menu fade-out

      // Mark as dismissed for this session (skip in preview mode)
      if (!isPreviewMode) {
        sessionStorage.setItem(`tour-menu-dismissed-${tourId}`, 'true');
      }

      sendMenuEvent('menu_closed', menuData?.settings, isMobile, { triggerSource });

      onClose?.();
    },
    [isPreviewMode, tourId, menuData, isMobile, sendMenuEvent, onClose]
  );

  const handleWidgetClick = useCallback(() => {
    setShowWidget(false);

    // Clear session storage to allow menu to show
    if (!isPreviewMode) {
      sessionStorage.removeItem(`tour-menu-dismissed-${tourId}`);
    }

    // Show menu after widget fades out
    setTimeout(() => {
      setIsVisible(true);
    }, 200);

    if (menuData?.settings) {
      const chrome = getEffectiveMenuChrome(menuData.settings, isMobile ? 'mobile' : 'desktop');
      // "icon_button" = this is the menu's primary trigger (configured to start closed);
      // "reopen_widget" = it started open and the visitor is reopening after dismissing it.
      const triggerSource: MenuTriggerSource = chrome.startOpen ? 'reopen_widget' : 'icon_button';
      sendMenuEvent('menu_opened', menuData.settings, isMobile, { triggerSource });
    }
  }, [isPreviewMode, tourId, menuData, isMobile, sendMenuEvent]);

  // Every nav row / button that isn't close_menu, open_chat or none (all handled directly by
  // the renderer) bubbles up here: tour points, other tours/models, and external links.
  const handleItemActivate = useCallback(
    (item: TourMenuActivatedItem) => {
      if (!isTourReady) {
        console.warn('⚠️ Tour not ready yet - menu item disabled');
        return;
      }

      const action = item.action;

      const trackClick = (targetRef?: string | null) => {
        sendMenuEvent('menu_item_clicked', menuData?.settings, isMobile, {
          triggerSource: 'item_action',
          itemId: item.id,
          itemLabel: item.label,
          itemType: item.itemType,
          actionType: action.type,
          targetRef: targetRef ?? null,
        });
      };

      switch (action.type) {
        case 'tour_point': {
          trackClick(action.pointId);

          if (action.pointId) {
            // Switches model first (if the point lives on a different one) then navigates.
            fetchAndNavigateToTourPoint(action, currentModelId);
          }

          handleClose('item_action');
          break;
        }

        case 'tour_model': {
          trackClick(action.tourId);

          if (action.modelId) {
            if (action.modelId === currentModelId) {
              // Already on this model - just close menu normally
              handleClose('item_action');
              break;
            }

            // Different model - dispatch switch event
            window.dispatchEvent(
              new CustomEvent('switch_matterport_model', {
                detail: { modelId: action.modelId, tourName: action.modelName || 'Tour' },
              })
            );

            // Temporarily hide menu and widget during transition
            setIsVisible(false);
            setShowWidget(false);

            const settingsSnapshot = menuData?.settings;
            const shouldAutoOpen =
              getEffectiveMenuChrome(settingsSnapshot, isMobile ? 'mobile' : 'desktop').startOpen;

            // Only clear dismissal when the menu is configured to start open on the new model.
            // Hamburger menus (start_open = false) should stay closed behind the trigger.
            if (!isPreviewMode && shouldAutoOpen) {
              sessionStorage.removeItem(`tour-menu-dismissed-${tourId}`);
            }

            setTimeout(() => {
              if (shouldAutoOpen) {
                setIsVisible(true);
                setShowWidget(false);
              } else {
                setIsVisible(false);
                setShowWidget(true);
              }
            }, 1500);
          }
          break;
        }

        case 'external_url': {
          trackClick(action.url);
          const opened = openExternalUrl(action.url, action.openIn);
          if (opened) {
            handleClose('item_action');
          }
          break;
        }

        default:
          handleClose('item_action');
      }
    },
    [isTourReady, menuData, isMobile, sendMenuEvent, currentModelId, isPreviewMode, tourId, handleClose]
  );

  const handleOpenChatFromRenderer = useCallback(
    (opts?: { prompt?: string; autoSend?: boolean }) => {
      sendMenuEvent('menu_item_clicked', menuData?.settings, isMobile, {
        triggerSource: 'item_action',
        actionType: 'open_chat',
        targetRef: opts?.prompt ? opts.prompt.slice(0, 200) : null,
      });

      if (opts?.prompt && opts.autoSend) {
        sendMenuEvent('menu_ai_prompt_sent', menuData?.settings, isMobile, {
          triggerSource: 'item_action',
          actionType: 'open_chat',
          targetRef: opts.prompt.slice(0, 200),
        });
      }

      onOpenChat?.(opts);
      handleClose('item_action');
    },
    [sendMenuEvent, menuData, isMobile, onOpenChat, handleClose]
  );

  // Don't render anything if still loading
  if (isLoading) {
    return null;
  }

  // Don't render if no menu data or menu not enabled
  if (!menuData || !menuData.settings) {
    return null;
  }

  const settings = menuData.settings;
  const blocks = menuData.blocks;

  // If menu not visible, show widget (if enabled)
  if (!isVisible) {
    return (
      <TourMenuWidget settings={settings} onClick={handleWidgetClick} isVisible={showWidget} isMobile={isMobile} />
    );
  }

  return (
    <TourMenuRenderer
      settings={settings}
      blocks={blocks}
      isVisible={isVisible}
      isMobile={isMobile}
      isTourReady={isTourReady}
      isChatAvailable={isChatAvailable}
      mode="live"
      onClose={handleClose}
      onItemActivate={handleItemActivate}
      onOpenChat={handleOpenChatFromRenderer}
    />
  );
}

/** Fetches a tour point's sweep and dispatches the Matterport navigate event, switching model first if required. */
async function fetchAndNavigateToTourPoint(
  action: Extract<MenuItemAction, { type: 'tour_point' }>,
  currentModelId?: string
) {
  try {
    const response = await fetch(`/api/public/tours/points/${action.pointId}`);
    if (!response.ok) return;

    const point = await response.json();
    if (!point || !point.sweep_id) return;

    const navigateToPoint = () => {
      window.dispatchEvent(
        new CustomEvent('matterport_navigate', {
          detail: {
            sweep_id: point.sweep_id,
            position: point.position,
            rotation: point.rotation,
            area_name: point.name,
          },
        })
      );
    };

    if (action.modelId && action.modelId !== currentModelId) {
      window.dispatchEvent(
        new CustomEvent('switch_matterport_model', {
          detail: { modelId: action.modelId, tourName: action.modelName || 'Tour' },
        })
      );
      // Wait for model load transition before navigating to sweep.
      setTimeout(navigateToPoint, 1500);
    } else {
      navigateToPoint();
    }
  } catch (error) {
    // Fail silently - the menu still closes even if the point lookup fails.
    console.error('Error fetching tour point:', error);
  }
}

/** Opens a validated http(s) URL respecting the configured tab target. Returns whether it opened. */
function openExternalUrl(rawUrl: string, openIn: 'same_tab' | 'new_tab'): boolean {
  if (!rawUrl) return false;

  try {
    let urlString = rawUrl.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    if (openIn === 'same_tab') {
      window.location.href = urlString;
    } else {
      window.open(urlString, '_blank', 'noopener,noreferrer');
    }
    return true;
  } catch (error) {
    console.error('Invalid URL:', rawUrl);
    return false;
  }
}
