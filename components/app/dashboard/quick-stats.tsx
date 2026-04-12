"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  MessageCircle, 
  Globe, 
  Clock, 
  CreditCard,
  Target,
  FileText,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";

interface QuickStatsProps {
  className?: string;
}

export function QuickStats({ className }: QuickStatsProps) {
  const { data, loading, errors, refreshQuickStats } = useDashboard();
  const stats = data.quickStats;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, text: 'Active', color: 'text-green-600' };
      case 'trialing':
        return { variant: 'default' as const, text: 'Trial', color: 'text-blue-600' };
      case 'pending':
        return { variant: 'secondary' as const, text: 'Pending', color: 'text-yellow-600' };
      case 'past_due':
        return { variant: 'destructive' as const, text: 'Past Due', color: 'text-red-600' };
      case 'cancelled':
        return { variant: 'destructive' as const, text: 'Cancelled', color: 'text-red-600' };
      default:
        return { variant: 'secondary' as const, text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessIcon = (percentage: number) => {
    if (percentage >= 80) return '✓';
    if (percentage >= 50) return '◐';
    return '○';
  };

  if (loading.quickStats) {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-2 bg-gray-200 rounded animate-pulse w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (errors.quickStats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">{errors.quickStats}</p>
            <Button onClick={refreshQuickStats} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-6">
              <div className="text-center text-muted-foreground">
                <div className="h-4 w-4 bg-gray-200 rounded mx-auto mb-1"></div>
                <p className="text-xs">No data</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const subscriptionBadge = getSubscriptionStatusBadge(stats.subscriptionStatus);

  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
      {/* Views This Week */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-600" />
            Views This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold text-blue-600">
            {formatNumber(stats.viewsThisWeek)}
          </div>
          <p className="text-xs text-muted-foreground">last 7 days</p>
        </CardContent>
      </Card>

      {/* Total Messages */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-purple-600" />
            Total Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold text-purple-600">
            {formatNumber(stats.tourChatMessages)}
          </div>
          <p className="text-xs text-muted-foreground">all time messages</p>
        </CardContent>
      </Card>

      {/* Total Leads */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <Target className="h-3 w-3 text-green-600" />
            Total Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold text-green-600">
            {formatNumber(stats.totalLeads || 0)}
          </div>
          <p className="text-xs text-muted-foreground">all time leads</p>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-600" />
            Avg Response
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold text-orange-600">
            {stats.avgResponseTime}ms
          </div>
          <p className="text-xs text-muted-foreground">response time</p>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <CreditCard className="h-3 w-3 text-indigo-600" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.subscriptionDetails && stats.subscriptionDetails.currentPrice ? (
            <>
              <div className="text-lg font-bold text-indigo-600">
                £{stats.subscriptionDetails.currentPrice.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.subscriptionDetails.isTrial && stats.subscriptionDetails.trialDaysRemaining !== null 
                  ? `${stats.subscriptionDetails.trialDaysRemaining} days remaining`
                  : stats.subscriptionDetails.billingCycle === 'yearly' ? 'per year' : 'per month'}
              </p>
            </>
          ) : (
            <>
              <div className="text-lg font-bold">
                <Badge variant={subscriptionBadge.variant} className="text-xs">
                  {subscriptionBadge.text}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">no subscription</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Venue information completeness */}
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1">
            <FileText className="h-3 w-3 text-teal-600" />
            Profile Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-lg font-bold ${getCompletenessColor(stats.venueInfoCompleteness)} flex items-center gap-1`}>
            <span>{getCompletenessIcon(stats.venueInfoCompleteness)}</span>
            {stats.venueInfoCompleteness}%
          </div>
          <p className="text-xs text-muted-foreground">venue information</p>
        </CardContent>
      </Card>
    </div>
  );
} 