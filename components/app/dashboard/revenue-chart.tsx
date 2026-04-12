"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  PoundSterling,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";
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
  Cell,
} from "recharts";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

interface RevenueChartProps {
  className?: string;
}

export function RevenueChart({ className }: RevenueChartProps) {
  const { data, loading, errors, refreshRevenueMetrics } = useDashboard();
  const metrics = data.revenueMetrics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(1)}k`;
    }
    return formatCurrency(amount);
  };

  if (loading.revenueMetrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-green-600" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>Monthly revenue trends and subscription breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Growth metrics skeleton */}
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

  if (errors.revenueMetrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-green-600" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load revenue data</h3>
            <p className="text-muted-foreground mb-4">{errors.revenueMetrics}</p>
            <Button onClick={refreshRevenueMetrics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-green-600" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>Monthly revenue trends and subscription breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <PoundSterling className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No revenue data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isGrowthPositive = metrics.revenueGrowth >= 0;
  const growthIcon = isGrowthPositive ? TrendingUp : TrendingDown;
  const growthColor = isGrowthPositive ? 'text-green-600' : 'text-red-600';

  // Prepare subscription breakdown for pie chart
  const subscriptionPieData = metrics.subscriptionBreakdown.map((item, index) => ({
    name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
    value: item.revenue,
    count: item.count,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PoundSterling className="h-5 w-5 text-green-600" />
          Revenue Analytics
        </CardTitle>
        <CardDescription>Monthly revenue trends and subscription breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-sm font-medium text-muted-foreground mb-1">This Month</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.currentMonthRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">Current month revenue</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Growth</div>
              <div className={`text-2xl font-bold ${growthColor} flex items-center justify-center gap-1`}>
                {React.createElement(growthIcon, { className: 'h-5 w-5' })}
                {Math.abs(metrics.revenueGrowth)}%
              </div>
              <div className="text-xs text-muted-foreground">vs last month</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">All-time earnings</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3">Monthly Revenue Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrencyCompact}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subscription Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3">Subscription Breakdown</h4>
              {subscriptionPieData.length > 0 ? (
                <div className="flex items-center">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={subscriptionPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                      >
                        {subscriptionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {subscriptionPieData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.count} subscription{item.count !== 1 ? 's' : ''} • {formatCurrency(item.value)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <PoundSterling className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active subscriptions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Insights */}
          {metrics.monthlyData.length > 1 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Revenue Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Average monthly revenue:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(
                      metrics.monthlyData.reduce((sum, month) => sum + month.revenue, 0) / metrics.monthlyData.length
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Best performing month:</span>
                  <span className="ml-2 font-medium">
                    {metrics.monthlyData.reduce((best, month) => 
                      month.revenue > best.revenue ? month : best, 
                      metrics.monthlyData[0]
                    ).month}
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