"use client";

import { AppTitle } from "@/components/shared/app-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  Users,
  MessageCircle,
  PoundSterling,
  RefreshCw, 
  AlertTriangle,
  Clock3
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const { data, isLoading, error, lastRefresh, refreshData } = useAdminDashboard();

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return "Not refreshed yet";
    return date.toLocaleTimeString("en-GB", { 
      hour: '2-digit', 
      minute: '2-digit',
    });
  };

  const formatNumber = (value: number) => new Intl.NumberFormat("en-GB").format(value || 0);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((value || 0) / 100);

  const metrics = data?.metrics;
  const recentActivity = data?.recentActivity?.slice(0, 5) || [];

  const kpis = [
    {
      label: "Total accounts",
      value: formatNumber(metrics?.totalVenues || 0),
      icon: Building2,
    },
    {
      label: "Total messages",
      value: formatNumber(metrics?.totalMessages || 0),
      icon: MessageCircle,
    },
    {
      label: "Total conversations",
      value: formatNumber(metrics?.totalConversations || 0),
      icon: Users,
    },
    {
      label: "Monthly revenue",
      value: formatCurrency(metrics?.monthlyRevenue || 0),
      icon: PoundSterling,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <AppTitle 
          title="Platform Dashboard"
          description="A clean overview of platform health, customer activity, and commercial performance."
        />
        
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                Failed to Load Dashboard
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                {error}
              </p>
              <Button
                onClick={refreshData}
                variant="outline"
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppTitle 
        title="Platform Dashboard"
        description="A streamlined view of platform performance and operational health."
        action={
          <Button
            onClick={refreshData}
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-900">Core metrics</CardTitle>
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
              Last updated: {formatLastRefresh(lastRefresh)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">{item.label}</p>
                  <item.icon className="h-4 w-4 text-slate-400" />
                </div>
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
                ) : (
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              </>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{activity.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(activity.timestamp).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                No recent platform activity is available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 