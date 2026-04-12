import { supabase } from './supabase';
import { getVenueInformationCompleteness } from './venue-information-service';
import { 
  Subscription, 
  Invoice, 
  EmbedStat, 
  Conversation, 
  Tour, 
  ChatbotConfig,
  VenueInformation,
  Analytics 
} from './types';

export interface DashboardOverview {
  totalTourViews: number;
  totalTourMoves: number;
  totalTourConversations: number;
  tourChatEngagementRate: number;
  uniqueDomains: number;
}

export interface QuickStats {
  viewsThisWeek: number;
  tourChatMessages: number;
  messageCreditsUsed: number;
  messageCreditsLimit: number;
  spacesUsed: number;
  spacesLimit: number;
  uniqueDomains: number;
  totalLeads: number;
  avgResponseTime: number;
  subscriptionStatus: string;
  subscriptionDetails: {
    planName: string | null;
    currentPrice: number | null;
    billingCycle: string | null;
    isTrial: boolean;
    trialDaysRemaining: number | null;
    trialEndDate: string | null;
  } | null;
  venueInfoCompleteness: number;
  /** True when at least one tour chatbot config exists with is_active (matches Settings “Status: Active”). */
  hasActiveTourChatbot?: boolean;
  /** True when at least one active tour chatbot has customised Information Sections vs the default General Information template. */
  hasCustomisedTourTraining?: boolean;
  /** True after the venue has copied the simple iframe embed code (venues.pressed_share). */
  pressedShare?: boolean;
}

export interface RevenueMetrics {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalRevenue: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  subscriptionBreakdown: Array<{
    plan: string;
    count: number;
    revenue: number;
  }>;
}

export interface VisitorAnalytics {
  totalTourViews: number;
  totalTourMoves: number;
  totalChatInteractions: number;
  dailyData: Array<{
    date: string;
    tourViews: number;
    tourMoves: number;
    chatMessages: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  topDomains: Array<{
    domain: string;
    views: number;
    conversations: number;
  }>;
}

export interface ActivityItem {
  id: string;
  type: 'conversation' | 'tour_view' | 'subscription' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface PerformanceMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  popularTourSections: Array<{
    section: string;
    views: number;
  }>;
  chatbotEffectiveness: {
    totalQueries: number;
    resolvedQueries: number;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'setup' | 'engagement' | 'billing' | 'content';
  actionUrl?: string;
  completed: boolean;
}

// Main dashboard overview data
export async function getDashboardOverview(venueId: string): Promise<DashboardOverview> {
  try {
    console.log('Fetching dashboard overview for venue:', venueId);

    // Use same pagination approach as getVisitorAnalytics to avoid 1000 record limit
    let totalTourViews = 0;
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: tourStats } = await supabase
        .from('embed_stats')
        .select('views_count')
        .eq('venue_id', venueId)
        .eq('embed_type', 'tour')
        .range(offset, offset + batchSize - 1);

      if (tourStats && tourStats.length > 0) {
        const batchSum = tourStats.reduce((sum, stat) => sum + (stat.views_count || 0), 0);
        totalTourViews += batchSum;
        offset += batchSize;
        hasMore = tourStats.length === batchSize;
        console.log(`Dashboard overview batch ${Math.floor(offset / batchSize)}: ${tourStats.length} records, batch sum: ${batchSum}, running total: ${totalTourViews}`);
      } else {
        hasMore = false;
      }
    }

    console.log('Total tour views (paginated sum of views_count):', totalTourViews);

    // Get unique domains where tour is embedded
    const { data: embedStats } = await supabase
      .from('embed_stats')
      .select('domain')
      .eq('venue_id', venueId)
      .eq('embed_type', 'tour');

    const uniqueDomains = new Set(embedStats?.map(stat => stat.domain).filter(Boolean)).size;

    console.log('Unique domains:', uniqueDomains);

    // Get total tour conversations (unique conversation IDs)
    const { data: tourConversations, error: tourConvError } = await supabase
      .from('conversations')
      .select('conversation_id')
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour');

    if (tourConvError) {
      console.error('Error fetching tour conversations:', tourConvError);
    }

    const totalTourConversations = tourConversations ? 
      new Set(tourConversations.map(c => c.conversation_id).filter(Boolean)).size : 0;

    console.log('Total tour conversations:', totalTourConversations);

    const { count: totalTourMovesCount } = await supabase
      .from('embed_tour_moves')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    // Calculate tour chat engagement rate (tour conversations / tour views * 100)
    let tourChatEngagementRate = 0;
    if (totalTourViews > 0 && totalTourConversations >= 0) {
      tourChatEngagementRate = (totalTourConversations / totalTourViews) * 100;
    }

    const result = {
      totalTourViews: Number(totalTourViews) || 0,
      totalTourMoves: Number(totalTourMovesCount || 0) || 0,
      totalTourConversations: Number(totalTourConversations) || 0,
      tourChatEngagementRate: Number(tourChatEngagementRate.toFixed(1)) || 0,
      uniqueDomains: Number(uniqueDomains) || 0
    };

    console.log('Dashboard overview result:', result);
    return result;

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    // Return default values instead of throwing
    return {
      totalTourViews: 0,
      totalTourMoves: 0,
      totalTourConversations: 0,
      tourChatEngagementRate: 0,
      uniqueDomains: 0
    };
  }
}

// Quick stats for secondary metrics
export async function getQuickStats(venueId: string): Promise<QuickStats> {
  try {
    // Views this week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: viewsThisWeek } = await supabase
      .from('embed_stats')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('embed_type', 'tour')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Tour chat messages (only count user messages)
    const { count: tourChatMessages } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour')
      .eq('message_type', 'visitor');

    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    // Unique domains
    const { data: embedStats } = await supabase
      .from('embed_stats')
      .select('domain')
      .eq('venue_id', venueId);

    const uniqueDomains = new Set(embedStats?.map(stat => stat.domain).filter(Boolean)).size;

    // Average response time
    const { data: responseTimes } = await supabase
      .from('conversations')
      .select('response_time_ms')
      .eq('venue_id', venueId)
      .not('response_time_ms', 'is', null);

    const avgResponseTime = responseTimes && responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, conv) => sum + (conv.response_time_ms || 0), 0) / responseTimes.length)
      : 0;

    // Billing usage and limits
    const { data: billingRecord } = await supabase
      .from('venue_billing_records')
      .select('*')
      .eq('venue_id', venueId)
      .maybeSingle();

    const planCode =
      billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
        ? billingRecord.override_plan_code
        : (billingRecord?.plan_code || 'free');

    const { data: billingPlan } = await supabase
      .from('billing_plans')
      .select('included_spaces, included_messages')
      .eq('code', planCode)
      .maybeSingle();

    const baseSpacesFromPlan = Number(billingPlan?.included_spaces || 0);
    const baseSpaces = Math.max(baseSpacesFromPlan, planCode === 'free' ? 1 : 0);
    const baseMessages = Number(billingPlan?.included_messages || 0);
    const addonExtraSpaces = Number(billingRecord?.addon_extra_spaces || 0);
    const addonMessageBlocks = Number(billingRecord?.addon_message_blocks || 0);
    const spacesLimit = Number(
      billingRecord?.effective_space_limit ??
      (baseSpaces + addonExtraSpaces)
    );
    const messageCreditsLimit = Number(
      billingRecord?.effective_message_limit ??
      // Each extra space includes +1,000 message credits.
      (baseMessages + (addonExtraSpaces * 1000) + (addonMessageBlocks * 1000))
    );

    // Usage values
    const messageCreditsUsed = Number(tourChatMessages || 0);
    const { count: spacesUsedCount } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);
    const spacesUsed = Number(spacesUsedCount || 0);

    // Subscription details with trial information
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan_name, current_price, billing_cycle, is_trial, trial_end_date')
      .eq('venue_id', venueId)
      .single();

    // Calculate trial days remaining if on trial
    let trialDaysRemaining = null;
    if (subscription?.is_trial && subscription?.trial_end_date) {
      const endDate = new Date(subscription.trial_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      trialDaysRemaining = diffDays > 0 ? diffDays : 0;
    }

    // Venue information completeness (legacy-named information table)
    const { data: venueInformationRow } = await supabase
      .from('venue_information')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    const venueInfoCompleteness = getVenueInformationCompleteness(venueInformationRow);

    return {
      viewsThisWeek: viewsThisWeek || 0,
      tourChatMessages: tourChatMessages || 0,
      messageCreditsUsed,
      messageCreditsLimit,
      spacesUsed,
      spacesLimit,
      uniqueDomains,
      totalLeads: totalLeads || 0,
      avgResponseTime,
      subscriptionStatus: subscription?.status || 'pending',
      subscriptionDetails: subscription ? {
        planName: subscription.plan_name || null,
        currentPrice: subscription.current_price || null,
        billingCycle: subscription.billing_cycle || null,
        isTrial: subscription.is_trial || false,
        trialDaysRemaining,
        trialEndDate: subscription.trial_end_date || null,
      } : null,
      venueInfoCompleteness
    };
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    throw new Error('Failed to fetch quick stats');
  }
}

// Revenue metrics and trends
export async function getRevenueMetrics(venueId: string): Promise<RevenueMetrics> {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month revenue
    const { data: currentMonthInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('venue_id', venueId)
      .eq('status', 'paid')
      .gte('created_at', currentMonth.toISOString());

    const currentMonthRevenue = currentMonthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Last month revenue
    const { data: lastMonthInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('venue_id', venueId)
      .eq('status', 'paid')
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    const lastMonthRevenue = lastMonthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Total revenue
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('venue_id', venueId)
      .eq('status', 'paid');

    const totalRevenue = allInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Monthly data for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('amount_paid')
        .eq('venue_id', venueId)
        .eq('status', 'paid')
        .gte('created_at', month.toISOString())
        .lt('created_at', nextMonth.toISOString());

      const monthRevenue = monthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
      
      monthlyData.push({
        month: month.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        invoices: monthInvoices?.length || 0
      });
    }

    // Subscription breakdown
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan_name, current_price')
      .eq('venue_id', venueId)
      .eq('status', 'active');

    const subscriptionBreakdown = subscriptions?.reduce((acc: any[], sub) => {
      const existing = acc.find(item => item.plan === sub.plan_name);
      if (existing) {
        existing.count += 1;
        existing.revenue += sub.current_price || 0;
      } else {
        acc.push({
          plan: sub.plan_name,
          count: 1,
          revenue: sub.current_price || 0
        });
      }
      return acc;
    }, []) || [];

    return {
      currentMonthRevenue,
      lastMonthRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalRevenue,
      monthlyData,
      subscriptionBreakdown
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    throw new Error('Failed to fetch revenue metrics');
  }
}

// Visitor analytics and engagement
export async function getVisitorAnalytics(venueId: string): Promise<VisitorAnalytics> {
  try {
    // Total tour views using pagination
    let totalTourViews = 0;
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: tourStats } = await supabase
        .from('embed_stats')
        .select('views_count')
        .eq('venue_id', venueId)
        .eq('embed_type', 'tour')
        .range(offset, offset + batchSize - 1);

      if (tourStats && tourStats.length > 0) {
        const batchSum = tourStats.reduce((sum, stat) => sum + (stat.views_count || 0), 0);
        totalTourViews += batchSum;
        offset += batchSize;
        hasMore = tourStats.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    // Total chat interactions (only count user messages)
    const { count: totalChatInteractions } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('message_type', 'visitor');

    // Daily data for chart (last 7 days)
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      // Tour views for this day - count records created on this day
      const { count: dayTourViews } = await supabase
        .from('embed_stats')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('embed_type', 'tour')
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      // Chat messages for this day (only count user messages)
      const { count: dayChatMessages } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('message_type', 'visitor')
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const { count: dayTourMoves } = await supabase
        .from('embed_tour_moves')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      dailyData.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        tourViews: dayTourViews || 0,
        tourMoves: dayTourMoves || 0,
        chatMessages: dayChatMessages || 0
      });
    }

    // Device breakdown - use embed_stats to get all tour view devices, not just chatters
    const { data: embedStats } = await supabase
      .from('embed_stats')
      .select('user_agent')
      .eq('venue_id', venueId)
      .eq('embed_type', 'tour')
      .not('user_agent', 'is', null);

    const deviceCounts = embedStats?.reduce((acc: any, stat) => {
      const ua = stat.user_agent?.toLowerCase() || '';
      let device = 'Desktop';
      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        device = 'Mobile';
      } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
        device = 'Tablet';
      }
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalDeviceCount = Object.values(deviceCounts).reduce((sum: number, count: any) => sum + count, 0);
    const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]: [string, any]) => ({
      device,
      count,
      percentage: totalDeviceCount > 0 ? Math.round((count / totalDeviceCount) * 100) : 0
    }));

    // Top domains - use pagination for this too
    const domainStats: any = {};
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const { data: embedStats } = await supabase
        .from('embed_stats')
        .select('domain, views_count')
        .eq('venue_id', venueId)
        .not('domain', 'is', null)
        .range(offset, offset + batchSize - 1);

      if (embedStats && embedStats.length > 0) {
        embedStats.forEach(stat => {
          if (stat.domain) {
            domainStats[stat.domain] = (domainStats[stat.domain] || 0) + stat.views_count;
          }
        });
        offset += batchSize;
        hasMore = embedStats.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    const { data: domainConversations } = await supabase
      .from('conversations')
      .select('domain, conversation_id')
      .eq('venue_id', venueId)
      .not('domain', 'is', null);

    const domainConvCounts = domainConversations?.reduce((acc: any, conv) => {
      if (conv.domain) {
        acc[conv.domain] = new Set([...(acc[conv.domain] || []), conv.conversation_id]);
      }
      return acc;
    }, {}) || {};

    const topDomains = Object.entries(domainStats)
      .map(([domain, views]: [string, any]) => ({
        domain,
        views,
        conversations: domainConvCounts[domain]?.size || 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const { count: totalTourMovesAllTime } = await supabase
      .from('embed_tour_moves')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    return {
      totalTourViews,
      totalTourMoves: totalTourMovesAllTime || 0,
      totalChatInteractions: totalChatInteractions || 0,
      dailyData,
      deviceBreakdown,
      topDomains
    };
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    throw new Error('Failed to fetch visitor analytics');
  }
}

// Recent activity feed
export async function getRecentActivity(venueId: string): Promise<ActivityItem[]> {
  try {
    const activities: ActivityItem[] = [];

    // Recent conversations (last 10)
    const { data: recentConversations } = await supabase
      .from('conversations')
      .select('id, conversation_id, chatbot_type, domain, created_at')
      .eq('venue_id', venueId)
      .eq('message_position', 1) // First message in conversation
      .order('created_at', { ascending: false })
      .limit(5);

    recentConversations?.forEach(conv => {
      activities.push({
        id: `conv-${conv.id}`,
        type: 'conversation',
        title: `New ${conv.chatbot_type} conversation`,
        description: `Visitor started chatting${conv.domain ? ` on ${conv.domain}` : ''}`,
        timestamp: conv.created_at,
        metadata: { conversationId: conv.conversation_id, type: conv.chatbot_type }
      });
    });

    // Recent tour views
    const { data: recentTourViews } = await supabase
      .from('embed_stats')
      .select('id, domain, views_count, last_viewed_at')
      .eq('venue_id', venueId)
      .eq('embed_type', 'tour')
      .order('last_viewed_at', { ascending: false })
      .limit(3);

    recentTourViews?.forEach(view => {
      activities.push({
        id: `tour-${view.id}`,
        type: 'tour_view',
        title: 'Tour viewed',
        description: `${view.views_count} view(s)${view.domain ? ` on ${view.domain}` : ''}`,
        timestamp: view.last_viewed_at,
        metadata: { domain: view.domain, views: view.views_count }
      });
    });

    // Recent subscription events
    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select('id, status, plan_name, updated_at')
      .eq('venue_id', venueId)
      .order('updated_at', { ascending: false })
      .limit(2);

    recentSubscriptions?.forEach(sub => {
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        title: `Subscription ${sub.status}`,
        description: `${sub.plan_name} plan is now ${sub.status}`,
        timestamp: sub.updated_at,
        metadata: { plan: sub.plan_name, status: sub.status }
      });
    });

    // Sort all activities by timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw new Error('Failed to fetch recent activity');
  }
}

// Performance metrics
export async function getPerformanceMetrics(venueId: string): Promise<PerformanceMetrics> {
  try {
    // Average session duration (estimated from conversation length)
    const { data: conversations } = await supabase
      .from('conversations')
      .select('conversation_id, created_at')
      .eq('venue_id', venueId);

    const sessionDurations: number[] = [];
    const conversationGroups = conversations?.reduce((acc: any, conv) => {
      if (!acc[conv.conversation_id]) {
        acc[conv.conversation_id] = [];
      }
      acc[conv.conversation_id].push(new Date(conv.created_at));
      return acc;
    }, {}) || {};

    Object.values(conversationGroups).forEach((timestamps: any) => {
      if (timestamps.length > 1) {
        const duration = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
        sessionDurations.push(duration / 1000 / 60); // Convert to minutes
      }
    });

    const avgSessionDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length)
      : 0;

    // Bounce rate (single message conversations)
    const singleMessageConversations = Object.values(conversationGroups).filter((timestamps: any) => timestamps.length === 1).length;
    const totalConversations = Object.keys(conversationGroups).length;
    const bounceRate = totalConversations > 0 ? (singleMessageConversations / totalConversations) * 100 : 0;

    // Conversion rate (conversations that led to engagement)
    const engagedConversations = Object.values(conversationGroups).filter((timestamps: any) => timestamps.length >= 3).length;
    const conversionRate = totalConversations > 0 ? (engagedConversations / totalConversations) * 100 : 0;

    // Popular tour sections (simplified - based on embed stats)
    const { data: tourStats } = await supabase
      .from('embed_stats')
      .select('page_url, views_count')
      .eq('venue_id', venueId)
      .eq('embed_type', 'tour')
      .not('page_url', 'is', null);

    const popularTourSections = tourStats?.reduce((acc: any[], stat) => {
      const section = stat.page_url?.split('/').pop() || 'Main Tour';
      const existing = acc.find(item => item.section === section);
      if (existing) {
        existing.views += stat.views_count;
      } else {
        acc.push({ section, views: stat.views_count });
      }
      return acc;
    }, [])
    .sort((a, b) => b.views - a.views)
    .slice(0, 5) || [];

    // Chatbot effectiveness
    const { count: totalQueries } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('message_type', 'visitor');

    const resolvedQueries = engagedConversations; // Simplified metric

    return {
      avgSessionDuration,
      bounceRate: Math.round(bounceRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      popularTourSections,
      chatbotEffectiveness: {
        totalQueries: totalQueries || 0,
        resolvedQueries
      }
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw new Error('Failed to fetch performance metrics');
  }
}

// Action items for venue operators
export async function getActionItems(venueId: string): Promise<ActionItem[]> {
  try {
    const actionItems: ActionItem[] = [];

    // Check venue information completeness (legacy-named information table)
    const { data: venueInformationRow } = await supabase
      .from('venue_information')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (!venueInformationRow) {
      actionItems.push({
        id: 'venue-info-setup',
        title: 'Complete venue information',
        description: 'Add detailed information about your venue to improve chatbot responses',
        priority: 'high',
        type: 'setup',
        actionUrl: '/app/chatbots',
        completed: false
      });
    } else {
      const completeness = getVenueInformationCompleteness(venueInformationRow);

      if (completeness < 70) {
        actionItems.push({
          id: 'venue-info-improve',
          title: 'Improve venue information',
          description: `Your venue profile is ${Math.round(completeness)}% complete. Add more details to help visitors.`,
          priority: 'medium',
          type: 'setup',
          actionUrl: '/app/chatbots',
          completed: false
        });
      }
    }

    // Check tour setup
    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (!tour) {
      actionItems.push({
        id: 'tour-setup',
        title: 'Create Virtual Tour',
        description: 'Set up your virtual tour to showcase your venue to potential members',
        priority: 'high',
        type: 'content',
        actionUrl: '/app/tours',
        completed: false
      });
    }

    // Check chatbot configuration
    const { data: chatbotConfigs } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('venue_id', venueId);

    if (!chatbotConfigs || chatbotConfigs.length === 0) {
      actionItems.push({
        id: 'chatbot-setup',
        title: 'Configure Chatbots',
        description: 'Set up your tour chatbot to engage with visitors',
        priority: 'high',
        type: 'setup',
        actionUrl: '/app/chatbots',
        completed: false
      });
    }

    // Check recent engagement
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if ((recentConversations || 0) < 5) {
      actionItems.push({
        id: 'promote-chatbot',
        title: 'Promote Your Chatbot',
        description: 'Share your chatbot on social media or your website to increase engagement',
        priority: 'medium',
        type: 'engagement',
        actionUrl: '/app/chatbots',
        completed: false
      });
    }

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, next_billing_date')
      .eq('venue_id', venueId)
      .single();

    if (!subscription || subscription.status !== 'active') {
      actionItems.push({
        id: 'subscription-setup',
        title: 'Activate Subscription',
        description: 'Complete your subscription setup to unlock all features',
        priority: 'high',
        type: 'billing',
        actionUrl: '/app/settings',
        completed: false
      });
    } else if (subscription.next_billing_date) {
      const billingDate = new Date(subscription.next_billing_date);
      const daysUntilBilling = Math.ceil((billingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilBilling <= 7) {
        actionItems.push({
          id: 'billing-reminder',
          title: 'Upcoming Billing',
          description: `Your next billing date is in ${daysUntilBilling} day(s)`,
          priority: 'low',
          type: 'billing',
          actionUrl: '/app/settings',
          completed: false
        });
      }
    }

    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  } catch (error) {
    console.error('Error fetching action items:', error);
    throw new Error('Failed to fetch action items');
  }
} 