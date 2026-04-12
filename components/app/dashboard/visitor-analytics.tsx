"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  MessageCircle, 
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  AlertCircle,
  MousePointer2,
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface VisitorAnalyticsProps {
  className?: string;
}

export function VisitorAnalytics({ className }: VisitorAnalyticsProps) {
  const { data, loading, errors, refreshVisitorAnalytics } = useDashboard();
  const analytics = data.visitorAnalytics;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

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

  if (loading.visitorAnalytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Visitor Analytics
          </CardTitle>
          <CardDescription>Tour views, chat interactions, and visitor insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary metrics skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
                </div>
              ))}
            </div>
            {/* Chart skeleton */}
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.visitorAnalytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Visitor Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load visitor data</h3>
            <p className="text-muted-foreground mb-4">{errors.visitorAnalytics}</p>
            <Button onClick={refreshVisitorAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Visitor Analytics
          </CardTitle>
          <CardDescription>Tour views, chat interactions, and visitor insights</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No visitor data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare device breakdown for pie chart
  const devicePieData = analytics.deviceBreakdown.map((item, index) => ({
    name: item.device,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Visitor Analytics
        </CardTitle>
        <CardDescription>Tour views, chat interactions, and visitor insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
            <div className="text-center p-3 md:p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-blue-50 dark:bg-neutral-800">
              <div className="text-sm font-medium text-gray-600 dark:text-neutral-200 mb-1">Total Tour Views</div>
              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                <Eye className="h-4 w-4 md:h-5 md:w-5" />
                {formatNumber(analytics.totalTourViews)}
              </div>
            </div>

            <div className="text-center p-3 md:p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-emerald-50 dark:bg-neutral-800">
              <div className="text-sm font-medium text-gray-600 dark:text-neutral-200 mb-1">Tour Moves</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <MousePointer2 className="h-4 w-4 md:h-5 md:w-5" />
                {formatNumber(analytics.totalTourMoves ?? 0)}
              </div>
            </div>
            
            <div className="text-center p-3 md:p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-purple-50 dark:bg-neutral-800 col-span-2 md:col-span-1">
              <div className="text-sm font-medium text-gray-600 dark:text-neutral-200 mb-1">Total Chat Messages</div>
              <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                {formatNumber(analytics.totalChatInteractions)}
              </div>
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Daily Activity (Last 7 Days)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.dailyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip 
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tourViews" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Tour Views"
                />
                <Area 
                  type="monotone" 
                  dataKey="tourMoves" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Tour Moves"
                />
                <Area 
                  type="monotone" 
                  dataKey="chatMessages" 
                  stackId="1"
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6}
                  name="Chat Messages"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown and Top Domains - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3">Device Breakdown</h4>
              {devicePieData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                      <Pie
                        data={devicePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percentage }) => `${percentage}%`}
                        labelLine={false}
                      >
                        {devicePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Visitors']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-fit mx-auto">
                    {devicePieData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex items-center gap-1 flex-1">
                          {getDeviceIcon(item.name)}
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.value} ({item.percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No device data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Domains */}
            <div>
              <h4 className="text-sm font-medium mb-3">Top Domains</h4>
              {analytics.topDomains.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topDomains.map((domain, index) => (
                    <div key={domain.domain} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {domain.domain}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {domain.conversations} conversation{domain.conversations !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatNumber(domain.views)}</div>
                        <div className="text-xs text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No domain data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Insights */}
          {analytics.dailyData.length > 0 && (
            <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-neutral-100">Visitor Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-neutral-400">Average daily tour views:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {Math.round(
                      analytics.dailyData.reduce((sum, day) => sum + day.tourViews, 0) / analytics.dailyData.length
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-neutral-400">Average daily chat messages:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {Math.round(
                      analytics.dailyData.reduce((sum, day) => sum + day.chatMessages, 0) / analytics.dailyData.length
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-neutral-400">Most active domain:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {analytics.topDomains.length > 0 ? analytics.topDomains[0].domain : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 