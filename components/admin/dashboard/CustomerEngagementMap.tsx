"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin,
  Trophy,
  Smartphone,
  Monitor,
  Tablet,
  Users,
  MessageSquare,
  Eye,
  Target
} from "lucide-react";
import { CustomerEngagement } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface CustomerEngagementMapProps {
  engagement: CustomerEngagement;
  isLoading?: boolean;
}

const DEVICE_COLORS = {
  'Mobile': '#EC4899',
  'Desktop': '#1E40AF', 
  'Tablet': '#10B981'
};

export function CustomerEngagementMap({ engagement, isLoading }: CustomerEngagementMapProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-green';
    if (score >= 60) return 'text-warning-orange';
    return 'text-red-500';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success-green/10';
    if (score >= 60) return 'bg-warning-orange/10';
    return 'bg-red-500/10';
  };

  // Prepare chart data
  const cityChartData = engagement.geographicDistribution.map(item => ({
    name: item.city,
    venues: item.venueCount ?? 0,
    activity: item.totalActivity
  }));

  const deviceChartData = engagement.deviceAnalytics.map(item => ({
    name: item.device,
    value: item.count,
    percentage: item.percentage,
    color: DEVICE_COLORS[item.device as keyof typeof DEVICE_COLORS] || '#6B7280'
  }));

  const DeviceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-brand-blue">
            {data.value} sessions ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning-orange" />
          Top Performing Venues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(engagement.topPerformingVenues ?? []).map((venue, index) => (
            <div key={venue.id} className="flex items-center justify-between p-4 rounded-lg bg-bg-secondary-light dark:bg-bg-secondary-dark">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm",
                  index === 0 ? "bg-warning-orange text-white" :
                  index === 1 ? "bg-gray-400 text-white" :
                  index === 2 ? "bg-amber-600 text-white" :
                  "bg-gray-200 text-gray-600"
                )}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {venue.name}
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {venue.city}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-warning-orange">
                    {venue.tourViews}
                  </div>
                  <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Tour Views
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-ai-pink">
                    {venue.conversations}
                  </div>
                  <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Conversations
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium",
                    getHealthScoreColor(venue.healthScore)
                  )}>
                    {venue.healthScore}
                  </div>
                  <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    Health Score
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 