"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Flame, 
  Star, 
  Circle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

type InterestLevel = 'high' | 'medium' | 'low';

interface InterestLevelBadgeProps {
  level: InterestLevel;
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const interestConfig = {
  high: {
    label: 'High Interest',
    shortLabel: 'High',
    icon: Flame,
    trendIcon: TrendingUp,
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeVariant: 'destructive' as const,
    description: 'Very interested, likely to convert',
    priority: 3,
    colorClass: 'text-red-600'
  },
  medium: {
    label: 'Medium Interest',
    shortLabel: 'Medium',
    icon: Star,
    trendIcon: Minus,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeVariant: 'outline' as const,
    description: 'Moderate interest, needs nurturing',
    priority: 2,
    colorClass: 'text-yellow-600'
  },
  low: {
    label: 'Low Interest',
    shortLabel: 'Low',
    icon: Circle,
    trendIcon: TrendingDown,
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeVariant: 'secondary' as const,
    description: 'Limited interest, long-term prospect',
    priority: 1,
    colorClass: 'text-green-600'
  }
};

export function InterestLevelBadge({
  level,
  showIcon = true,
  showLabel = true,
  variant = 'default',
  size = 'default',
  className
}: InterestLevelBadgeProps) {
  const config = interestConfig[level];
  const Icon = config.icon;
  const TrendIcon = config.trendIcon;

  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center gap-1",
        config.colorClass,
        size === 'sm' && "text-xs",
        size === 'lg' && "text-base",
        className
      )}>
        {showIcon && <Icon className={cn(
          "h-3 w-3",
          size === 'sm' && "h-2 w-2",
          size === 'lg' && "h-4 w-4"
        )} />}
        {showLabel && (
          <span className="font-medium">
            {config.shortLabel}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg border",
        config.color,
        className
      )}>
        <div className="flex items-center gap-1">
          {showIcon && <Icon className="h-4 w-4" />}
          <TrendIcon className="h-3 w-3" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs opacity-80">{config.description}</span>
        </div>
      </div>
    );
  }

  return (
    <Badge 
      variant={config.badgeVariant}
      className={cn(
        "flex items-center gap-1 w-fit",
        size === 'sm' && "text-xs px-2 py-1",
        size === 'lg' && "text-sm px-3 py-2",
        // Override badge variant colors for consistency
        level === 'high' && "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        level === 'medium' && "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        level === 'low' && "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        className
      )}
    >
      {showIcon && <Icon className={cn(
        "h-3 w-3",
        size === 'sm' && "h-2 w-2",
        size === 'lg' && "h-4 w-4"
      )} />}
      {showLabel && config.shortLabel}
    </Badge>
  );
}

// Export utility functions for use in other components
export const getInterestConfig = (level: InterestLevel) => interestConfig[level];

export const getInterestIcon = (level: InterestLevel) => {
  const config = interestConfig[level];
  return config ? config.icon : Circle;
};

export const getInterestColor = (level: InterestLevel) => {
  const config = interestConfig[level];
  return config ? config.color : 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getInterestColorClass = (level: InterestLevel) => {
  const config = interestConfig[level];
  return config ? config.colorClass : 'text-gray-600';
};

export const getInterestLabel = (level: InterestLevel, short: boolean = true) => {
  const config = interestConfig[level];
  return config ? (short ? config.shortLabel : config.label) : 'Unknown';
};

export const getInterestPriority = (level: InterestLevel) => {
  const config = interestConfig[level];
  return config ? config.priority : 0;
};

export const getAllInterestLevels = (): InterestLevel[] => {
  return Object.keys(interestConfig) as InterestLevel[];
};

export const sortByInterestLevel = <T extends { interest_level?: InterestLevel | null }>(
  items: T[], 
  direction: 'asc' | 'desc' = 'desc'
): T[] => {
  return items.sort((a, b) => {
    const aPriority = a.interest_level ? getInterestPriority(a.interest_level) : 0;
    const bPriority = b.interest_level ? getInterestPriority(b.interest_level) : 0;
    
    return direction === 'desc' ? bPriority - aPriority : aPriority - bPriority;
  });
};

// Component for displaying multiple interest levels (e.g., in a filter)
interface InterestLevelListProps {
  levels: InterestLevel[];
  onLevelClick?: (level: InterestLevel) => void;
  selectedLevels?: InterestLevel[];
  className?: string;
}

export function InterestLevelList({ 
  levels, 
  onLevelClick, 
  selectedLevels = [],
  className 
}: InterestLevelListProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onLevelClick?.(level)}
          className={cn(
            "transition-all duration-200",
            selectedLevels.includes(level) && "ring-2 ring-blue-500 ring-offset-2"
          )}
        >
          <InterestLevelBadge 
            level={level} 
            size="sm"
            className={cn(
              onLevelClick && "cursor-pointer hover:scale-105",
              selectedLevels.includes(level) && "opacity-100",
              !selectedLevels.includes(level) && selectedLevels.length > 0 && "opacity-50"
            )}
          />
        </button>
      ))}
    </div>
  );
} 