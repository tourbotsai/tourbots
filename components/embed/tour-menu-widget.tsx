"use client";

import { HelpCircle, Info, Menu } from 'lucide-react';
import { TourMenuSettings, WIDGET_SIZE_MAP, WIDGET_ICON_SIZE_MAP, WIDGET_SHADOW_MAP } from '@/lib/types';
import { getEffectiveMenuChrome } from '@/lib/tour-menu';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  HelpCircle,
  Info,
  Menu
};

// Typical chat launcher footprint (bubble + margin) when it shares the bottom-right
// corner with the menu trigger. Nudging by this much keeps the two from overlapping.
const CHAT_LAUNCHER_CLEARANCE_PX = 64;

interface TourMenuWidgetProps {
  settings: TourMenuSettings | Record<string, any>;
  onClick: () => void;
  isVisible: boolean;
  isMobile?: boolean;
}

export function TourMenuWidget({ settings, onClick, isVisible, isMobile = false }: TourMenuWidgetProps) {
  const chrome = getEffectiveMenuChrome(settings, isMobile ? 'mobile' : 'desktop');

  // The parent only mounts this while the menu itself is hidden, so the trigger is
  // always available to (re)open it — whether that's its first appearance (menu
  // configured to start closed) or a reopen after the visitor dismissed it.
  const Icon = ICON_MAP[chrome.widgetIcon] || Menu;
  const buttonSize = WIDGET_SIZE_MAP[chrome.widgetSize];
  const iconSize = WIDGET_ICON_SIZE_MAP[chrome.widgetSize];
  const shadow = WIDGET_SHADOW_MAP[chrome.widgetShadowIntensity];

  const position = chrome.widgetPosition;
  const positionStyles: React.CSSProperties = {};

  if (position.includes('bottom')) {
    positionStyles.bottom = `${chrome.widgetYOffset}px`;
  } else {
    positionStyles.top = `${chrome.widgetYOffset}px`;
  }

  // Bottom-right is the conventional home for chat launchers, so nudge the menu
  // trigger further from that corner when the venue wants to avoid a collision.
  const xOffset =
    chrome.avoidChatLauncher && position === 'bottom-right'
      ? chrome.widgetXOffset + CHAT_LAUNCHER_CLEARANCE_PX
      : chrome.widgetXOffset;

  if (position.includes('left')) {
    positionStyles.left = `${xOffset}px`;
  } else {
    positionStyles.right = `${xOffset}px`;
  }

  return (
    <button
      onClick={onClick}
      title={chrome.widgetTooltipText}
      aria-label={chrome.widgetTooltipText}
      className={cn(
        "absolute z-[9998] transition-all duration-300",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
      )}
      style={{
        ...positionStyles,
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        backgroundColor: chrome.widgetColor,
        borderRadius: `${chrome.widgetBorderRadius}px`,
        boxShadow: shadow,
        border: '1px solid rgba(15, 23, 42, 0.06)',
        willChange: 'transform, opacity'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = chrome.widgetHoverColor;
        e.currentTarget.style.transform = 'scale(1.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = chrome.widgetColor;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none"
        style={{ borderRadius: `${chrome.widgetBorderRadius}px` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className="relative z-10"
          size={iconSize}
          strokeWidth={2.25}
          style={{ color: chrome.widgetIconColor }}
        />
      </div>
    </button>
  );
}
