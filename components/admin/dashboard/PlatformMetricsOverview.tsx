"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Eye,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { PlatformMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlatformMetricsOverviewProps {
  metrics: PlatformMetrics;
  isLoading?: boolean;
}

export function PlatformMetricsOverview({ metrics, isLoading }: PlatformMetricsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `£${(value / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getGrowthIndicator = (value: number, label: string) => {
    if (value === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Minus className="h-3 w-3" />
          <span>No change</span>
        </div>
      );
    }

    const isPositive = value > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isPositive ? "text-success-green" : "text-red-500"
      )}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span>+{Math.abs(value)} {label}</span>
      </div>
    );
  };

  const getRevenueGrowthIndicator = (value: number) => {
    if (value === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Minus className="h-3 w-3" />
          <span>No change</span>
        </div>
      );
    }

    const isPositive = value > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isPositive ? "text-success-green" : "text-red-500"
      )}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span>{isPositive ? '+' : ''}{value.toFixed(1)}% from last month</span>
      </div>
    );
  };

  const metricsData = [
    {
      title: "Total Venues",
      value: metrics.totalVenues.toLocaleString(),
      icon: Building2,
      description: "Active venue partners",
      color: "text-brand-blue",
      bgColor: "bg-brand-blue/10",
      growth: getGrowthIndicator(metrics.venuesGrowth, "this week"),
    },
    {
      title: "Active Users",
      value: metrics.activeUsers.toLocaleString(),
      icon: Users,
      description: "Platform users",
      color: "text-success-green",
      bgColor: "bg-success-green/10",
      growth: getGrowthIndicator(metrics.usersGrowth, "this week"),
    },
    {
      title: "Conversations",
      value: metrics.totalConversations.toLocaleString(),
      icon: MessageSquare,
      description: "AI chat sessions",
      color: "text-ai-pink",
      bgColor: "bg-ai-pink/10",
      growth: getGrowthIndicator(metrics.conversationsGrowth, "today"),
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(metrics.monthlyRevenue),
      icon: TrendingUp,
      description: "Current month",
      color: "text-emerald-600",
      bgColor: "bg-emerald-600/10",
      growth: getRevenueGrowthIndicator(metrics.revenueGrowth),
      isRevenue: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* All Metrics in One Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {metric.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                  <Icon className={cn("h-4 w-4", metric.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
                  {metric.value}
                </div>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mb-2">
                  {metric.description}
                </p>
                {metric.growth}
              </CardContent>
            </Card>
          );
        })}

        {/* Tour Views Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Tour Views
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning-orange/10">
              <Eye className="h-4 w-4 text-warning-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
              {metrics.totalTourViews.toLocaleString()}
            </div>
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mb-2">
              VR tour engagements
            </p>
            <Badge variant="outline" className="text-xs">
              Platform total
            </Badge>
          </CardContent>
        </Card>

        {/* Active Subscriptions Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Active Subscriptions
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-600/10">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-1">
              {metrics.activeSubscriptions.toLocaleString()}
            </div>
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mb-2">
              Paying customers
            </p>
            <Badge variant="outline" className="text-xs">
              {metrics.totalVenues > 0 ? Math.round((metrics.activeSubscriptions / metrics.totalVenues) * 100) : 0}% conversion
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 