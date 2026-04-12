"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Eye,
  Calendar,
  CreditCard
} from "lucide-react";

interface AdminMetricsProps {
  metrics?: {
    totalVenues: number;
    totalUsers: number;
    totalConversations: number;
    totalTourViews: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    recentSignups?: number;
    conversionRate?: number;
  };
  isLoading?: boolean;
}

export function AdminMetrics({ metrics, isLoading }: AdminMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Total venues",
      value: metrics.totalVenues,
      icon: Building2,
      description: "Registered venues",
      color: "text-brand-blue",
    },
    {
      title: "Active Users",
      value: metrics.totalUsers,
      icon: Users,
      description: "Platform users",
      color: "text-success-green",
    },
    {
      title: "Conversations",
      value: metrics.totalConversations,
      icon: MessageSquare,
      description: "AI chat sessions",
      color: "text-ai-pink",
    },
    {
      title: "Tour Views",
      value: metrics.totalTourViews,
      icon: Eye,
      description: "VR tour engagements",
      color: "text-warning-orange",
    },
    {
      title: "Subscriptions",
      value: metrics.activeSubscriptions,
      icon: CreditCard,
      description: "Active billing",
      color: "text-purple-600",
    },
    {
      title: "Monthly Revenue",
      value: `£${(metrics.monthlyRevenue / 100).toLocaleString()}`,
      icon: TrendingUp,
      description: "Current month",
      color: "text-emerald-600",
      isRevenue: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Metrics - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metricsData.slice(0, 4).map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                </div>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics - 2 columns on mobile and desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {metricsData.slice(4, 6).map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index + 4}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                </div>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
                  {metric.description}
                </p>
                {metric.isRevenue && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-success-green">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% from last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 