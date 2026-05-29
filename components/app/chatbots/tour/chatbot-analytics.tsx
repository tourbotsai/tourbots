"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, MessageCircle, Users, Clock, Globe, ArrowLeft } from "lucide-react";
import { useTourChatbotAnalytics } from "@/hooks/app/useTourChatbotAnalytics";
import { ConversationSessions } from "@/components/app/chatbots/shared/conversation-sessions";
import { Conversation } from "@/lib/types";
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
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { useTheme } from "@/components/app/shared/theme-provider";

const COLORS = ['#0F172A', '#1E3A8A', '#334155', '#64748B', '#94A3B8'];

interface ConversationGroup {
  conversation_id: string;
  session_id: string;
  messages: Conversation[];
  first_message_time: string;
  last_message_time: string;
  total_messages: number;
  visitor_messages: number;
  bot_messages: number;
  domain?: string;
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  embed_id?: string;
  avg_response_time?: number;
}

interface TourChatbotAnalyticsProps {
  onSwitchToSettings?: () => void;
  selectedTourId?: string | null;
}

export function TourChatbotAnalytics({ onSwitchToSettings, selectedTourId }: TourChatbotAnalyticsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const { conversations, isLoading, error, getConversationStats } = useTourChatbotAnalytics(selectedTourId);
  const { tourConfig, isLoading: configLoading } = useTourChatbotConfig(selectedTourId);
  const [stats, setStats] = useState<any>(null);
  const [conversationGroups, setConversationGroups] = useState<ConversationGroup[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await getConversationStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      }
    };

    loadData();
  }, [getConversationStats]);

  useEffect(() => {
    // Group conversations by conversation_id
    const grouped = conversations.reduce((acc: { [key: string]: Conversation[] }, conversation) => {
      const key = conversation.conversation_id || conversation.session_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(conversation);
      return acc;
    }, {});

    // Convert to ConversationGroup array and sort messages by position
    const groups: ConversationGroup[] = Object.entries(grouped).map(([conversationId, messages]) => {
      const sortedMessages = messages.sort((a, b) => (a.message_position || 0) - (b.message_position || 0));
      const visitorMessages = messages.filter(m => m.message_type === 'visitor');
      const botMessages = messages.filter(m => m.message_type === 'bot');
      const responseTimes = messages.filter(m => m.response_time_ms).map(m => m.response_time_ms!);
      
      return {
        conversation_id: conversationId,
        session_id: messages[0].session_id,
        messages: sortedMessages,
        first_message_time: sortedMessages[0]?.created_at || '',
        last_message_time: sortedMessages[sortedMessages.length - 1]?.created_at || '',
        total_messages: messages.length,
        visitor_messages: visitorMessages.length,
        bot_messages: botMessages.length,
        domain: messages[0]?.domain || undefined,
        ip_address: messages[0]?.ip_address || undefined,
        user_agent: messages[0]?.user_agent || undefined,
        page_url: messages[0]?.page_url || undefined,
        embed_id: messages[0]?.embed_id || undefined,
        avg_response_time: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : undefined
      };
    });

    // Sort by most recent first
    groups.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
    
    setConversationGroups(groups);
  }, [conversations]);

  // Prepare data for messages per day chart
  const messagesPerDayData = conversations.reduce((acc: { [key: string]: number }, conversation) => {
    const date = new Date(conversation.created_at).toLocaleDateString('en-GB');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(messagesPerDayData)
    .map(([date, count]) => ({ date, messages: count }))
    .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
    .slice(-7); // Last 7 days

  // Prepare device type data
  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return 'Desktop';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return 'Mobile';
    } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const deviceData = conversationGroups.reduce((acc: { [key: string]: number }, group) => {
    const deviceType = getDeviceType(group.user_agent);
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(deviceData).map(([device, count]) => ({
    name: device,
    value: count,
    percentage: Math.round((count / conversationGroups.length) * 100)
  }));

  if (configLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!selectedTourId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="py-10 text-center text-slate-600">
          Select a tour to view chatbot analytics.
        </CardContent>
      </Card>
    );
  }

  if (!tourConfig) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-slate-100 p-6">
            <BarChart3 className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900">
            No tour chatbot analytics available
          </h3>
          <p className="mb-6 max-w-md text-center text-slate-600">
            Configure your chatbot first, then analytics will appear here as visitors interact.
          </p>
          <Button 
            onClick={onSwitchToSettings}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl border border-red-200 bg-red-50/60 shadow-sm dark:border-input dark:bg-background">
        <CardContent className="py-8 text-center text-red-700">
          Error loading analytics: {error}
        </CardContent>
      </Card>
    );
  }

  if (!stats && conversationGroups.length === 0) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardContent className="py-10 text-center text-slate-600">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p>No chatbot analytics data available yet.</p>
          <p className="text-sm text-slate-500">Start conversations to see insights.</p>
        </CardContent>
      </Card>
    );
  }

  const visitorMessages = conversations.filter((c) => c.message_type === "visitor").length;
  const avgResponseTime =
    conversationGroups.filter((g) => typeof g.avg_response_time === "number").length > 0
      ? Math.round(
          conversationGroups
            .filter((g) => typeof g.avg_response_time === "number")
            .reduce((acc, group) => acc + (group.avg_response_time || 0), 0) /
            conversationGroups.filter((g) => typeof g.avg_response_time === "number").length
        )
      : 0;
  const activeDomains = new Set(conversationGroups.map((g) => g.domain).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">Chatbot Analytics</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Track chatbot usage, message volume, and conversation quality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Conversations</p>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{conversationGroups.length.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Visitor messages</p>
                <MessageCircle className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{visitorMessages.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Avg response</p>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{avgResponseTime}ms</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-input dark:bg-background">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Active domains</p>
                <Globe className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{activeDomains}</p>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <ConversationSessions conversations={conversations} typeLabel="tour" />

          <div className="h-px bg-slate-200" />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Messages per day</h3>
                <p className="text-xs text-slate-500">Daily chatbot message activity over the last 7 days.</p>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#E2E8F0"} />
                    <XAxis dataKey="date" tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <YAxis tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="messages" fill={isDarkMode ? "#64748B" : "#0F172A"} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm">No message data available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Device types</h3>
                <p className="text-xs text-slate-500">Conversation distribution by device type.</p>
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
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-slate-500">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm">No device data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 