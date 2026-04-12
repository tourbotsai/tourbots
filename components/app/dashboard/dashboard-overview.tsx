"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Globe, 
  Camera, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  MousePointer2,
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";

interface DashboardOverviewProps {
  className?: string;
}

export function DashboardOverview({ className }: DashboardOverviewProps) {
  const { data, loading, errors, refreshOverview } = useDashboard();
  const overview = data.overview;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const getEngagementRateColor = (rate: number) => {
    if (rate >= 15) return 'text-green-600';
    if (rate >= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading.overview) {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-5 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (errors.overview) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load overview</h3>
            <p className="text-muted-foreground mb-4">{errors.overview}</p>
            <Button onClick={refreshOverview} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-5 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center text-muted-foreground">
                <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <p className="text-sm">No data available</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-5 ${className}`}>
      {/* Total Tour Views */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tour Views</CardTitle>
          <Eye className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(overview.totalTourViews)}
          </div>
          <p className="text-xs text-muted-foreground">
            All-time tour interactions
          </p>
        </CardContent>
      </Card>

      {/* Tour moves (embed navigation) */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tour Moves</CardTitle>
          <MousePointer2 className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatNumber(overview.totalTourMoves ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Sweeps navigated on embedded tours
          </p>
        </CardContent>
      </Card>

      {/* Total Chats */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
          <Camera className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(overview.totalTourConversations)}
          </div>
          <p className="text-xs text-muted-foreground">
            All-time total conversations
          </p>
        </CardContent>
      </Card>

      {/* Tour Chat Engagement Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <span className="lg:hidden">Engagement</span>
            <span className="hidden lg:inline">Tour Chat Engagement Rate</span>
          </CardTitle>
          {overview.tourChatEngagementRate >= 10 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getEngagementRateColor(overview.tourChatEngagementRate)}`}>
            {overview.tourChatEngagementRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            Tour viewers who start chatting
          </p>
        </CardContent>
      </Card>

      {/* Active Domains */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
          <Globe className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(overview.uniqueDomains)}
          </div>
          <p className="text-xs text-muted-foreground">
            Websites hosting your tour
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 