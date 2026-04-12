"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  CheckCircle, 
  Trophy, 
  X,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface LeadStatusSelectProps {
  value?: LeadStatus;
  onValueChange?: (status: LeadStatus) => void;
  placeholder?: string;
  disabled?: boolean;
  showIcon?: boolean;
  variant?: 'default' | 'badge' | 'minimal';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const statusConfig = {
  new: {
    label: 'New Lead',
    icon: User,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeVariant: 'secondary' as const,
    description: 'Fresh lead, not yet contacted'
  },
  contacted: {
    label: 'Contacted',
    icon: Phone,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeVariant: 'outline' as const,
    description: 'Lead has been contacted by venue staff'
  },
  qualified: {
    label: 'Qualified',
    icon: CheckCircle,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeVariant: 'outline' as const,
    description: 'Lead shows genuine buying intent'
  },
  converted: {
    label: 'Converted',
    icon: Trophy,
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeVariant: 'default' as const,
    description: 'Lead became a paying customer'
  },
  lost: {
    label: 'Lost',
    icon: X,
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeVariant: 'destructive' as const,
    description: 'Lead is no longer interested'
  }
};

export function LeadStatusSelect({
  value,
  onValueChange,
  placeholder = "Select status...",
  disabled = false,
  showIcon = true,
  variant = 'default',
  size = 'default',
  className
}: LeadStatusSelectProps) {
  const currentStatus = value ? statusConfig[value] : null;

  if (variant === 'badge' && value) {
    const StatusIcon = currentStatus?.icon;
    
    return (
      <Badge 
        variant={currentStatus?.badgeVariant}
        className={cn(
          "flex items-center gap-1 w-fit",
          size === 'sm' && "text-xs px-2 py-1",
          size === 'lg' && "text-sm px-3 py-2",
          className
        )}
      >
        {showIcon && StatusIcon && <StatusIcon className="h-3 w-3" />}
        {currentStatus?.label}
      </Badge>
    );
  }

  if (variant === 'minimal' && value) {
    const StatusIcon = currentStatus?.icon;
    
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm",
        currentStatus?.color.includes('blue') && "text-blue-700",
        currentStatus?.color.includes('yellow') && "text-yellow-700",
        currentStatus?.color.includes('purple') && "text-purple-700",
        currentStatus?.color.includes('green') && "text-green-700",
        currentStatus?.color.includes('red') && "text-red-700",
        className
      )}>
        {showIcon && StatusIcon && <StatusIcon className="h-4 w-4" />}
        <span className="font-medium">{currentStatus?.label}</span>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        size === 'sm' && "h-8 text-xs",
        size === 'lg' && "h-12 text-base",
        className
      )}>
        <SelectValue placeholder={placeholder}>
          {value && currentStatus && (
            <div className="flex items-center gap-2">
              {showIcon && (
                <currentStatus.icon className={cn(
                  "h-4 w-4",
                  size === 'sm' && "h-3 w-3",
                  size === 'lg' && "h-5 w-5"
                )} />
              )}
              <span>{currentStatus.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(statusConfig) as Array<[LeadStatus, typeof statusConfig[LeadStatus]]>).map(([status, config]) => {
          const StatusIcon = config.icon;
          
          return (
            <SelectItem key={status} value={status} className="cursor-pointer">
              <div className="flex items-center gap-3">
                {showIcon && (
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full",
                    config.color
                  )}>
                    <StatusIcon className="h-3 w-3" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Export utility functions for use in other components
export const getStatusConfig = (status: LeadStatus) => statusConfig[status];

export const getStatusIcon = (status: LeadStatus) => {
  const config = statusConfig[status];
  return config ? config.icon : Clock;
};

export const getStatusColor = (status: LeadStatus) => {
  const config = statusConfig[status];
  return config ? config.color : 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusLabel = (status: LeadStatus) => {
  const config = statusConfig[status];
  return config ? config.label : 'Unknown';
};

export const getAllStatuses = (): LeadStatus[] => {
  return Object.keys(statusConfig) as LeadStatus[];
};

export const getStatusBadgeVariant = (status: LeadStatus) => {
  const config = statusConfig[status];
  return config ? config.badgeVariant : 'secondary';
}; 