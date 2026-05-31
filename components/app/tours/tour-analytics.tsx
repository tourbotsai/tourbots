"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useUser as useFirebaseUser } from 'reactfire';
import { useTourChatbotAnalytics } from '@/hooks/app/useTourChatbotAnalytics';
import { useTheme } from '@/components/app/shared/theme-provider';
import { ConversationSessions } from '@/components/app/chatbots/shared/conversation-sessions';
import { EmbedStatistics } from '@/components/app/chatbots/shared/embed-statistics';
import { EmbedStat, Tour } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Globe, BarChart3, Users, MessageCircle, ArrowLeft, Navigation } from 'lucide-react';
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

const COLORS = ['#0F172A', '#1E3A8A', '#334155', '#64748B', '#94A3B8'];

interface AnalyticsSummary {
  tourViews: number;
  tourMoves: number;
  totalConversations: number;
  tourChatMessages: number;
  uniqueDomains: number;
}

interface TourAnalyticsProps {
  selectedTourId?: string | null;
  onSwitchToViewer?: () => void;
  /** When set (e.g. a platform admin viewing another account), analytics are
   * scoped to this venue instead of the signed-in user's own. */
  forcedVenueId?: string | null;
}

export function TourAnalytics({ selectedTourId, onSwitchToViewer, forcedVenueId }: TourAnalyticsProps) {
  const { user } = useUser();
  const { data: authUser } = useFirebaseUser();
  const effectiveVenueId = forcedVenueId || user?.venue_id;
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const tooltipContentStyle = {
    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
    border: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
    borderRadius: 8,
    color: isDarkMode ? "#E2E8F0" : "#0F172A",
  };
  const tooltipItemStyle = { color: isDarkMode ? "#E2E8F0" : "#0F172A" };
  const tooltipLabelStyle = { color: isDarkMode ? "#94A3B8" : "#64748B" };
  const barCursorStyle = { fill: isDarkMode ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.06)" };
  const [tour, setTour] = useState<Tour | null>(null);
  const [stats, setStats] = useState<EmbedStat[]>([]);
  const [moves, setMoves] = useState<Array<{ created_at: string }>>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    tourViews: 0,
    tourMoves: 0,
    totalConversations: 0,
    tourChatMessages: 0,
    uniqueDomains: 0
  });
  const [loading, setLoading] = useState(true);
  const { conversations } = useTourChatbotAnalytics(selectedTourId, forcedVenueId);

  useEffect(() => {
    async function fetchTourAndAnalytics() {
      if (!effectiveVenueId || !selectedTourId) {
        setTour(null);
        setStats([]);
        setMoves([]);
        setSummary({
          tourViews: 0,
          tourMoves: 0,
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
          setMoves([]);
          setSummary({
            tourViews: 0,
            tourMoves: 0,
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
          `/api/app/tours/analytics?venueId=${encodeURIComponent(effectiveVenueId)}&tourId=${encodeURIComponent(selectedTourId)}`,
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
        setMoves(analytics.moves || []);

        setSummary({
          tourViews: analytics.summary?.tourViews || 0,
          tourMoves: analytics.summary?.tourMoves || 0,
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
  }, [effectiveVenueId, selectedTourId, authUser]);

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

  // Prepare data for tour moves per day chart (last 7 days)
  const tourMovesPerDay = moves.reduce((acc: { [key: string]: number }, move) => {
    const date = new Date(move.created_at).toLocaleDateString('en-GB');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const movesChartData = Object.entries(tourMovesPerDay)
    .map(([date, moveCount]) => ({ date, moves: moveCount }))
    .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
    .slice(-7); // Last 7 days

  // Prepare device type data based on actual user agents
  const getDeviceType = (userAgent?: string | null) => {
    if (!userAgent) return 'Desktop';
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return 'Mobile';
    } else     if (/tablet|ipad|playbook|silk/i.test(ua)) {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-neutral-800"></div>
                <div className="h-4 w-4 animate-pulse rounded bg-slate-200 dark:bg-neutral-800"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-neutral-800"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
          <CardHeader className="pb-3">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-neutral-800"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-neutral-800"></div>
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Tour views</p>
                <Eye className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.tourViews.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Tour moves</p>
                <Navigation className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.tourMoves.toLocaleString()}</p>
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

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tour views per day</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily tour view activity over the last 7 days.</p>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#E2E8F0"} />
                    <XAxis dataKey="date" tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <YAxis tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={barCursorStyle} />
                    <Bar dataKey="views" fill={isDarkMode ? "#64748B" : "#0F172A"} radius={[4, 4, 0, 0]} />
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tour moves per day</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily navigation moves within the tour over the last 7 days.</p>
              </div>
              {movesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={movesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#E2E8F0"} />
                    <XAxis dataKey="date" tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <YAxis tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={barCursorStyle} />
                    <Bar dataKey="moves" fill={isDarkMode ? "#64748B" : "#0F172A"} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-slate-500 dark:border-input dark:bg-background dark:text-slate-400">
                  <div className="text-center">
                    <Navigation className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm">No tour move data available</p>
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
                      label={({ cx, cy, midAngle, outerRadius, name, percentage }: any) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 18;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill={isDarkMode ? "#E2E8F0" : "#0F172A"} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
                            {`${name} (${percentage}%)`}
                          </text>
                        );
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
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

          <EmbedStatistics stats={stats} />

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          <ConversationSessions conversations={conversations} typeLabel="tour" />
        </CardContent>
      </Card>
    </div>
  );
} 