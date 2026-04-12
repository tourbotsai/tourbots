"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  PanelLeft, 
  PanelRight, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Smartphone,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsivePlaygroundContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsivePlaygroundContainer: React.FC<ResponsivePlaygroundContainerProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "w-full max-w-full mx-auto px-4 py-6 space-y-6",
      "min-h-screen bg-gradient-to-br from-gray-50 to-white",
      className
    )}>
      {children}
    </div>
  );
};

interface PlaygroundPanelProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  minHeight?: number;
  maxHeight?: number;
}

export const PlaygroundPanel: React.FC<PlaygroundPanelProps> = ({
  title,
  icon,
  badge,
  children,
  className,
  headerActions,
  isCollapsed = false,
  onToggleCollapsed,
  minHeight = 400,
  maxHeight = 800
}) => {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-medium text-gray-900">{title}</h3>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {headerActions}
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="p-1 h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <CardContent 
          className="flex-1 p-0 overflow-hidden"
          style={{ 
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`
          }}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
};

interface DualPanelLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftBadge?: string;
  rightBadge?: string;
  leftHeaderActions?: React.ReactNode;
  rightHeaderActions?: React.ReactNode;
  initialLayout?: 'split' | 'left-only' | 'right-only';
  onLayoutChange?: (layout: 'split' | 'left-only' | 'right-only') => void;
  className?: string;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
  showLayoutControls?: boolean;
  splitRatio?: number; // 0-100, default 50
  minPanelWidth?: number;
  responsiveBreakpoint?: number;
}

export const DualPanelLayout: React.FC<DualPanelLayoutProps> = ({
  leftPanel,
  rightPanel,
  leftTitle = "Chat Interface",
  rightTitle = "Live Preview",
  leftIcon = <MessageSquare className="h-4 w-4 text-blue-600" />,
  rightIcon = <Monitor className="h-4 w-4 text-purple-600" />,
  leftBadge,
  rightBadge,
  leftHeaderActions,
  rightHeaderActions,
  initialLayout = 'split',
  onLayoutChange,
  className,
  leftPanelClassName,
  rightPanelClassName,
  showLayoutControls = true,
  splitRatio = 50,
  minPanelWidth = 300,
  responsiveBreakpoint = 768
}) => {
  const [layout, setLayout] = useState<'split' | 'left-only' | 'right-only'>(initialLayout);
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(splitRatio);

  const handleLayoutChange = (newLayout: 'split' | 'left-only' | 'right-only') => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const layoutControls = showLayoutControls && (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={layout === 'left-only' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLayoutChange('left-only')}
        className="h-8 px-2"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <Button
        variant={layout === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLayoutChange('split')}
        className="h-8 px-2"
      >
        <PanelRight className="h-4 w-4" />
      </Button>
      <Button
        variant={layout === 'right-only' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLayoutChange('right-only')}
        className="h-8 px-2"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className={cn("w-full h-full", className)}>
      {/* Layout Controls */}
      {showLayoutControls && (
        <div className="flex justify-end mb-4">
          {layoutControls}
        </div>
      )}

      {/* Panel Container */}
      <div className="flex gap-6 h-full">
        {/* Left Panel */}
        {(layout === 'split' || layout === 'left-only') && (
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out",
              layout === 'left-only' ? 'w-full' : 'w-1/2',
              leftPanelClassName
            )}
          >
            <PlaygroundPanel
              title={leftTitle}
              icon={leftIcon}
              badge={leftBadge}
              headerActions={leftHeaderActions}
              className="h-full"
            >
              {leftPanel}
            </PlaygroundPanel>
          </div>
        )}

        {/* Panel Separator */}
        {layout === 'split' && (
          <div className="flex items-center justify-center w-px">
            <Separator orientation="vertical" className="h-full" />
          </div>
        )}

        {/* Right Panel */}
        {(layout === 'split' || layout === 'right-only') && (
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out",
              layout === 'right-only' ? 'w-full' : 'w-1/2',
              rightPanelClassName
            )}
          >
            <PlaygroundPanel
              title={rightTitle}
              icon={rightIcon}
              badge={rightBadge}
              headerActions={rightHeaderActions}
              className="h-full"
            >
              {rightPanel}
            </PlaygroundPanel>
          </div>
        )}
      </div>
    </div>
  );
};

interface PlaygroundSidebarProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  width?: number;
  position?: 'left' | 'right';
  className?: string;
}

export const PlaygroundSidebar: React.FC<PlaygroundSidebarProps> = ({
  children,
  isOpen = true,
  onToggle,
  width = 300,
  position = 'left',
  className
}) => {
  return (
    <div
      className={cn(
        "relative transition-all duration-300 ease-in-out border-r border-gray-200 bg-white",
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        position === 'left' ? 'border-r' : 'border-l',
        className
      )}
      style={{ width: isOpen ? `${width}px` : '0px' }}
    >
      <div className="h-full overflow-y-auto">
        {children}
      </div>
      
      {/* Toggle Button */}
      {onToggle && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className={cn(
            "absolute top-4 p-1 h-8 w-8 border shadow-sm",
            position === 'left' ? '-right-4' : '-left-4'
          )}
        >
          {isOpen ? (
            position === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            position === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};

interface PlaygroundGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  responsive?: boolean;
}

export const PlaygroundGrid: React.FC<PlaygroundGridProps> = ({
  children,
  columns = 2,
  gap = 6,
  className,
  responsive = true
}) => {
  const gridClasses = responsive 
    ? `grid grid-cols-1 md:grid-cols-${columns} gap-${gap}`
    : `grid grid-cols-${columns} gap-${gap}`;

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
};

export default {
  ResponsivePlaygroundContainer,
  PlaygroundPanel,
  DualPanelLayout,
  PlaygroundSidebar,
  PlaygroundGrid,
}; 