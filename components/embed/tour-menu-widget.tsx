"use client";

import { HelpCircle, Info, Menu } from 'lucide-react';
import { TourMenuSettings, WIDGET_SIZE_MAP, WIDGET_ICON_SIZE_MAP, WIDGET_SHADOW_MAP } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  HelpCircle,
  Info,
  Menu
};

interface TourMenuWidgetProps {
  settings: TourMenuSettings;
  onClick: () => void;
  isVisible: boolean;
}

export function TourMenuWidget({ settings, onClick, isVisible }: TourMenuWidgetProps) {
  if (!settings.show_reopen_widget) return null;
  
  const Icon = ICON_MAP[settings.widget_icon];
  const buttonSize = WIDGET_SIZE_MAP[settings.widget_size];
  const iconSize = WIDGET_ICON_SIZE_MAP[settings.widget_size];
  const shadow = WIDGET_SHADOW_MAP[settings.widget_shadow_intensity];
  
  // Calculate position
  const position = settings.widget_position;
  const positionStyles: React.CSSProperties = {};
  
  if (position.includes('bottom')) {
    positionStyles.bottom = `${settings.widget_y_offset}px`;
  } else {
    positionStyles.top = `${settings.widget_y_offset}px`;
  }
  
  if (position.includes('left')) {
    positionStyles.left = `${settings.widget_x_offset}px`;
  } else {
    positionStyles.right = `${settings.widget_x_offset}px`;
  }
  
  return (
    <button
      onClick={onClick}
      title={settings.widget_tooltip_text}
      aria-label={settings.widget_tooltip_text}
      className={cn(
        "absolute z-[9998] group transition-all duration-300",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
      )}
      style={{
        ...positionStyles,
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        backgroundColor: settings.widget_color,
        borderRadius: `${settings.widget_border_radius}px`,
        boxShadow: shadow,
        willChange: 'transform, opacity'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = settings.widget_hover_color;
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = settings.widget_color;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Glass effect overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
        style={{ borderRadius: `${settings.widget_border_radius}px` }}
      />
      
      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon 
          className="drop-shadow-sm relative z-10" 
          size={iconSize}
          strokeWidth={2.5}
          style={{ color: settings.widget_icon_color }}
        />
      </div>
      
      {/* Pulse animation when idle */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-0 animate-pulse"
        style={{
          backgroundColor: settings.widget_color,
          filter: 'blur(8px)',
          zIndex: -1
        }}
      />
    </button>
  );
}

