"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useUser as useFirebaseUser } from 'reactfire';
import { EmbedStat, Tour } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Globe, Calendar, ExternalLink, BarChart3, Users, MessageCircle, Camera, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
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

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

interface AnalyticsSummary {
  tourViews: number;
  totalConversations: number;
  tourChatMessages: number;
  uniqueDomains: number;
}

interface TourAnalyticsProps {
  selectedTourId?: string | null;
  onSwitchToViewer?: () => void;
}

export function TourAnalytics({ selectedTourId, onSwitchToViewer }: TourAnalyticsProps) {
  const { user } = useUser();
  const { data: authUser } = useFirebaseUser();
  const [tour, setTour] = useState<Tour | null>(null);
  const [stats, setStats] = useState<EmbedStat[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    tourViews: 0,
    totalConversations: 0,
    tourChatMessages: 0,
    uniqueDomains: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEmbedStatsExpanded, setIsEmbedStatsExpanded] = useState(false);

  useEffect(() => {
    async function fetchTourAndAnalytics() {
      if (!user?.venue_id || !selectedTourId) {
        setTour(null);
        setStats([]);
        setSummary({
          tourViews: 0,
          totalConversations: 0,
          tourChatMessages: 0,
          uniqueDomains: 0
        });
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (!authUser) {
          setStats([]);
          setSummary({
            tourViews: 0,
            totalConversations: 0,
            tourChatMessages: 0,
            uniqueDomains: 0,
          });
          setLoading(false);
          return;
        }

        const token = await authUser.getIdToken();
        const tourResponse = await fetch(`/api/app/tours/${encodeURIComponent(selectedTourId)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!tourResponse.ok) {
          throw new Error('Failed to fetch tour');
        }
        const tourData = await tourResponse.json();
        setTour(tourData);

        if (!tourData) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/app/tours/analytics?venueId=${encodeURIComponent(user.venue_id)}&tourId=${encodeURIComponent(selectedTourId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tour analytics');
        }

        const analytics = await response.json();
        setStats(analytics.data || []);

        setSummary({
          tourViews: analytics.summary?.tourViews || 0,
          totalConversations: analytics.summary?.totalConversations || 0,
          tourChatMessages: analytics.summary?.tourChatMessages || 0,
          uniqueDomains: analytics.summary?.uniqueDomains || 0,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTourAndAnalytics();
  }, [user?.venue_id, selectedTourId, authUser]);

  // Prepare data for tour views per day chart (last 7 days)
  const tourViewsPerDay = stats
    .filter(stat => stat.embed_type === 'tour')
    .reduce((acc: { [key: string]: number }, stat) => {
      const date = new Date(stat.last_viewed_at).toLocaleDateString('en-GB');
      acc[date] = (acc[date] || 0) + stat.views_count;
      return acc;
    }, {});

  const chartData = Object.entries(tourViewsPerDay)
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
    .slice(-7); // Last 7 days

  // Prepare device type data based on actual user agents
  const getDeviceType = (userAgent?: string | null) => {
    if (!userAgent) return 'Desktop';
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return 'Mobile';
    } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const deviceData = stats
    .filter(stat => stat.embed_type === 'tour')
    .reduce((acc: { [key: string]: number }, stat) => {
      const deviceType = getDeviceType(stat.user_agent);
      acc[deviceType] = (acc[deviceType] || 0) + stat.views_count;
      return acc;
    }, {});

  const pieData = Object.entries(deviceData).map(([device, count]) => ({
    name: device,
    value: count,
    percentage: Math.round((count / summary.tourViews) * 100) || 0
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDomain = (domain?: string | null) => {
    if (!domain) return 'Unknown';
    return domain.replace(/^www\./, '');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200"></div>
                <div className="h-4 w-4 animate-pulse rounded bg-slate-200"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-8 w-16 animate-pulse rounded bg-slate-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
          <CardHeader className="pb-3">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-200"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tour) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-slate-100 p-6 dark:border dark:border-input dark:bg-background">
            <BarChart3 className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            No analytics available yet
          </h3>
          <p className="mb-6 max-w-md text-center text-slate-600 dark:text-slate-400">
            You need to set up your 3D tour first before you can view analytics and track tour performance.
          </p>
          <Button 
            onClick={onSwitchToViewer}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Tour Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Tour Analytics</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Track tour views, engagement, and where visitors interact with your embed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Tour views</p>
                <Eye className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.tourViews.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total conversations</p>
                <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.totalConversations.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Tour chat messages</p>
                <MessageCircle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.tourChatMessages.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Unique domains</p>
                <Globe className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.uniqueDomains}</p>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tour views per day</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily tour view activity over the last 7 days.</p>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-slate-500 dark:border-input dark:bg-background dark:text-slate-400">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm">No tour view data available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Device types</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of tour views by device.</p>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-slate-500 dark:border-input dark:bg-background dark:text-slate-400">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm">No device data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Embed statistics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detailed performance across websites and pages.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmbedStatsExpanded(!isEmbedStatsExpanded)}
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isEmbedStatsExpanded ? (
                  <>
                    Collapse
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Expand
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {isEmbedStatsExpanded && (
              <div className="rounded-lg border border-slate-200 bg-white dark:border-input dark:bg-background">
            {stats.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <Globe className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p className="text-sm">No embed data yet</p>
                <p className="text-xs">Share your tours to start seeing analytics.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block space-y-3 p-3 sm:hidden">
                  {stats.map((stat) => (
                    <Card key={stat.id} className="rounded-lg border border-slate-200 p-3 shadow-none dark:border-input dark:bg-background">
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={stat.embed_type === 'tour' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {stat.embed_type === 'tour' ? 'Tour' : 'Chatbot'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Eye className="h-3 w-3" />
                          {stat.views_count.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{formatDomain(stat.domain)}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(stat.last_viewed_at)}
                        </div>
                        {stat.page_url && (
                          <a
                            href={stat.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs dark:text-slate-300 dark:hover:text-slate-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Page
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Domain</TableHead>
                        <TableHead className="text-xs">Views</TableHead>
                        <TableHead className="text-xs">Last Viewed</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell>
                            <Badge 
                              variant={stat.embed_type === 'tour' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {stat.embed_type === 'tour' ? 'Tour' : 'Chatbot'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {formatDomain(stat.domain)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span className="text-sm font-medium">{stat.views_count.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(stat.last_viewed_at)}
                          </TableCell>
                          <TableCell>
                            {stat.page_url && (
                              <a
                                href={stat.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs dark:text-slate-300 dark:hover:text-slate-100"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 