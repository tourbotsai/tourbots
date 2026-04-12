"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  CalendarDays, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { HardLimitConfig, HardLimitUsage } from '@/lib/types';
import { 
  calculateUsagePercentage, 
  getUsageColor, 
  getUsageLevel,
  getRemainingMessages,
  formatTimeRemaining,
  getTimeUntilNextReset,
  HARD_LIMIT_ALERT_THRESHOLDS
} from '@/lib/utils/hard-limit-calculations';

interface HardLimitUsageWidgetProps {
  config: HardLimitConfig;
  usage: HardLimitUsage | null;
  chatbotType: 'tour';
  showActions?: boolean;
  onUpgrade?: () => void;
  compact?: boolean;
  className?: string;
}

export function HardLimitUsageWidget({
  config,
  usage,
  chatbotType,
  showActions = false,
  onUpgrade,
  compact = false,
  className = ""
}: HardLimitUsageWidgetProps) {
  
  if (!config.enabled) {
    return (
      <Card className={`${compact ? 'p-4' : ''} ${className} dark:border-input dark:bg-background`}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Hard limits disabled</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card className={`${compact ? 'p-4' : ''} ${className} dark:border-input dark:bg-background`}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="text-sm">No usage data available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageData = [
    {
      period: 'Daily',
      used: usage.daily_messages_used,
      limit: config.dailyMessages,
      icon: Clock,
      resetInfo: 'Resets at midnight'
    },
    {
      period: 'Weekly',
      used: usage.weekly_messages_used,
      limit: config.weeklyMessages,
      icon: CalendarDays,
      resetInfo: 'Resets on Monday'
    },
    {
      period: 'Monthly',
      used: usage.monthly_messages_used,
      limit: config.monthlyMessages,
      icon: Calendar,
      resetInfo: 'Resets on 1st of month'
    },
    {
      period: 'Yearly',
      used: usage.yearly_messages_used,
      limit: config.yearlyMessages,
      icon: BarChart3,
      resetInfo: 'Resets on January 1st'
    }
  ];

  // Find the highest usage percentage
  const maxUsagePercentage = Math.max(
    ...usageData.map(item => calculateUsagePercentage(item.used, item.limit))
  );

  const overallUsageColor = getUsageColor(maxUsagePercentage);
  const overallUsageLevel = getUsageLevel(maxUsagePercentage);

  // Check if any limits are exceeded
  const hasExceededLimits = usageData.some(item => item.used >= item.limit);
  const isApproachingLimits = maxUsagePercentage >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING;

  const getUsageStatusBadge = () => {
    if (hasExceededLimits) {
      return <Badge variant="destructive" className="text-xs">Limit Exceeded</Badge>;
    }
    if (maxUsagePercentage >= HARD_LIMIT_ALERT_THRESHOLDS.CRITICAL) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (maxUsagePercentage >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:border-input dark:bg-background dark:text-slate-300">Warning</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:border-input dark:bg-background dark:text-slate-300">Healthy</Badge>;
  };

  const renderUsageBar = (item: typeof usageData[0]) => {
    const percentage = calculateUsagePercentage(item.used, item.limit);
    const color = getUsageColor(percentage);
    const remaining = Math.max(0, item.limit - item.used);
    const Icon = item.icon;

    return (
      <div key={item.period} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{item.period}</span>
          </div>
          <div className="text-right">
            <div className="text-sm">
              <span className={`font-medium ${
                color === 'red' ? 'text-red-600' : 
                color === 'yellow' ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {item.used.toLocaleString()}
              </span>
              <span className="text-muted-foreground"> / {item.limit.toLocaleString()}</span>
            </div>
            {!compact && (
              <div className="text-xs text-muted-foreground">{item.resetInfo}</div>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <Progress 
            value={Math.min(percentage, 100)} 
            className={`h-1.5 ${
              color === 'red' ? 'bg-red-100' : 
              color === 'yellow' ? 'bg-yellow-100' : 
              'bg-green-100'
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    // Compact version - show only the most critical usage
    const mostCriticalUsage = usageData.reduce((prev, current) => {
      const prevPercentage = calculateUsagePercentage(prev.used, prev.limit);
      const currentPercentage = calculateUsagePercentage(current.used, current.limit);
      return currentPercentage > prevPercentage ? current : prev;
    });

    return (
      <Card className={`${className} dark:border-input dark:bg-background`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-blue" />
              <span className="font-medium text-sm">Usage</span>
            </div>
            {getUsageStatusBadge()}
          </div>
          {renderUsageBar(mostCriticalUsage)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} dark:border-input dark:bg-background`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-blue" />
            <CardTitle className="text-base">Hard Limit Usage</CardTitle>
          </div>
          {getUsageStatusBadge()}
        </div>
        <CardDescription>
          Current usage for {chatbotType} chatbot
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        {isApproachingLimits && (
          <div className={`p-3 rounded-md border ${
            hasExceededLimits 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                hasExceededLimits ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div className="text-sm">
                <p className={`font-medium ${
                  hasExceededLimits ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {hasExceededLimits ? 'Usage Limit Exceeded' : 'Approaching Usage Limit'}
                </p>
                <p className={`text-xs mt-1 ${
                  hasExceededLimits ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {hasExceededLimits 
                    ? 'Your chatbot is currently blocked due to exceeded limits.'
                    : 'Consider upgrading your plan or monitoring usage closely.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Breakdown */}
        <div className="space-y-4">
          {usageData.map(renderUsageBar)}
        </div>

        {/* Actions */}
        {showActions && (isApproachingLimits || hasExceededLimits) && (
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              {onUpgrade && (
                <Button
                  onClick={onUpgrade}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:border dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                >
                  Upgrade Plan
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/help/hard-limits', '_blank')}
              >
                Learn More
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        {!isApproachingLimits && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>All limits are within healthy ranges</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 