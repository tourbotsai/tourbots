import { supabaseServiceRole as supabase } from './supabase-service-role';
import { 
  PlatformMetrics, 
  PlatformHealth, 
  RevenueAnalytics, 
  CustomerEngagement, 
  PlatformActivity,
  AdminDashboardData 
} from './types';

async function getPlatformRecurringMonthlyRevenueGbp(): Promise<number> {
  const [{ data: activeVenues }, { data: billingRecords }, { data: billingPlans }, { data: billingAddons }] =
    await Promise.all([
      supabase
        .from('venues')
        .select('id')
        .eq('is_active', true),
      supabase
        .from('venue_billing_records')
        .select('venue_id, plan_code, billing_override_enabled, override_plan_code, addon_extra_spaces, addon_message_blocks, addon_white_label'),
      supabase
        .from('billing_plans')
        .select('code, monthly_price_gbp')
        .eq('is_active', true),
      supabase
        .from('billing_addons')
        .select('code, monthly_price_gbp')
        .eq('is_active', true),
    ]);

  const activeVenueIds = new Set((activeVenues || []).map((venue: any) => venue.id));
  if (!activeVenueIds.size) return 0;

  const recordsByVenue = new Map<string, any>();
  for (const record of billingRecords || []) {
    if (activeVenueIds.has(record.venue_id)) {
      recordsByVenue.set(record.venue_id, record);
    }
  }

  const planPriceByCode = new Map<string, number>(
    (billingPlans || []).map((plan: any) => [plan.code, Number(plan.monthly_price_gbp || 0)])
  );
  const addonPriceByCode = new Map<string, number>(
    (billingAddons || []).map((addon: any) => [addon.code, Number(addon.monthly_price_gbp || 0)])
  );

  const extraSpacePrice = Number(addonPriceByCode.get('extra_space') || 0);
  const messageBlockPrice = Number(addonPriceByCode.get('message_block') || 0);
  const whiteLabelPrice = Number(addonPriceByCode.get('white_label') || 0);

  let total = 0;

  for (const venueId of Array.from(activeVenueIds)) {
    const record = recordsByVenue.get(venueId);
    const resolvedPlanCode =
      record?.billing_override_enabled && record?.override_plan_code
        ? record.override_plan_code
        : (record?.plan_code || 'free');

    const planMonthly = Number(planPriceByCode.get(resolvedPlanCode) || 0);
    const extraSpacesQty = Number(record?.addon_extra_spaces || 0);
    const messageBlocksQty = Number(record?.addon_message_blocks || 0);
    const whiteLabelQty = record?.addon_white_label ? 1 : 0;

    total +=
      planMonthly +
      (extraSpacesQty * extraSpacePrice) +
      (messageBlocksQty * messageBlockPrice) +
      (whiteLabelQty * whiteLabelPrice);
  }

  return total;
}

// Get comprehensive platform metrics
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Total venues
    const { count: totalVenuesCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Venue growth (last week)
    const { count: newVenuesThisWeek } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', lastWeek.toISOString());

    // Active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Users growth (last week)
    const { count: newUsersThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', lastWeek.toISOString());

    // Total messages (all rows in conversations table)
    const { count: totalMessages } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Total conversations (distinct conversation threads)
    const { data: allConversationIds } = await supabase
      .from('conversations')
      .select('conversation_id')
      .not('conversation_id', 'is', null);
    const totalConversations = new Set(
      (allConversationIds || []).map((row: any) => row.conversation_id)
    ).size;

    // Conversations growth (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Monthly revenue (recurring): sum active venue plan + add-ons
    const monthlyRevenue = await getPlatformRecurringMonthlyRevenueGbp();

    // Last month revenue for growth calculation
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: lastMonthInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('status', 'paid')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', lastMonthEnd.toISOString());

    const lastMonthRevenue = lastMonthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Total tour views
    const { data: embedStats } = await supabase
      .from('embed_stats')
      .select('views_count')
      .eq('embed_type', 'tour');

    const totalTourViews = embedStats?.reduce((sum, stat) => sum + stat.views_count, 0) || 0;

    // Active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return {
      totalVenues: totalVenuesCount || 0,
      activeUsers: activeUsers || 0,
      totalMessages: totalMessages || 0,
      totalConversations: totalConversations || 0,
      monthlyRevenue: monthlyRevenue * 100, // Convert to pence for consistency
      totalTourViews,
      activeSubscriptions: activeSubscriptions || 0,
      venuesGrowth: newVenuesThisWeek || 0,
      usersGrowth: newUsersThisWeek || 0,
      conversationsGrowth: conversationsToday || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    throw new Error('Failed to fetch platform metrics');
  }
}

// Get platform health indicators
export async function getPlatformHealth(): Promise<PlatformHealth> {
  try {
    const now = new Date();
    
    // Get active sessions from conversations in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentSessions } = await supabase
      .from('conversations')
      .select('session_id')
      .gte('created_at', oneHourAgo.toISOString());

    const activeSessions = new Set(recentSessions?.map(c => c.session_id) || []).size;

    // 1. Platform conversations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 2. Active venues this month (venues with conversations)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: activeVenuesData } = await supabase
      .from('conversations')
      .select('venue_id')
      .gte('created_at', currentMonth.toISOString());

    const activeVenuesThisMonthCount = new Set(activeVenuesData?.map(c => c.venue_id).filter(Boolean)).size;

    // 3. Platform revenue this month (recurring): sum active venue plan + add-ons
    const monthlyRevenue = await getPlatformRecurringMonthlyRevenueGbp();

    // Check system health by testing database connectivity
    let systemStatus: 'operational' | 'degraded' | 'down' = 'operational';
    try {
      await supabase.from('venues').select('id').limit(1);
    } catch (error) {
      console.error('Database health check failed:', error);
      systemStatus = 'degraded';
    }

    return {
      systemStatus,
      activeSessions,
      conversationsToday: conversationsToday || 0,
      activeVenuesThisMonth: activeVenuesThisMonthCount,
      monthlyRevenue: monthlyRevenue * 100, // Convert to pence for consistency
    };
  } catch (error) {
    console.error('Error fetching platform health:', error);
    throw new Error('Failed to fetch platform health');
  }
}

// Get revenue analytics
export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  try {
    const now = new Date();
    
    // Current month revenue
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: currentMonthInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('status', 'paid')
      .gte('created_at', currentMonth.toISOString());

    const currentMonthRevenue = currentMonthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Last month revenue
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: lastMonthInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('status', 'paid')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', lastMonthEnd.toISOString());

    const lastMonthRevenue = lastMonthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Total revenue
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('status', 'paid');

    const totalRevenue = allInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

    // Subscription breakdown
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan_name, current_price')
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
          revenue: sub.current_price || 0,
          percentage: 0, // Will calculate after
        });
      }
      return acc;
    }, []) || [];

    // Calculate percentages
    const totalSubs = subscriptionBreakdown.reduce((sum, item) => sum + item.count, 0);
    subscriptionBreakdown.forEach(item => {
      item.percentage = totalSubs > 0 ? Math.round((item.count / totalSubs) * 100) : 0;
    });

    // Monthly data for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('amount_paid')
        .eq('status', 'paid')
        .gte('created_at', month.toISOString())
        .lt('created_at', nextMonth.toISOString());

      const { count: monthSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', month.toISOString())
        .lt('created_at', nextMonth.toISOString());

      monthlyData.push({
        month: month.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: monthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0,
        subscriptions: monthSubscriptions || 0,
      });
    }

    return {
      currentMonthRevenue,
      lastMonthRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalRevenue,
      subscriptionBreakdown,
      monthlyData,
    };
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    throw new Error('Failed to fetch revenue analytics');
  }
}

// Get customer engagement data
export async function getCustomerEngagement(): Promise<CustomerEngagement> {
  try {
    // Top performing venues
    const { data: venuesData } = await supabase
      .from('venues')
      .select(`
        id,
        name,
        city,
        embed_stats!inner(views_count),
        conversations!inner(id)
      `)
      .eq('is_active', true);

    const topPerformingVenues = venuesData?.map((venueRow: any) => {
      const tourViews = venueRow.embed_stats?.reduce((sum: number, stat: any) => sum + stat.views_count, 0) || 0;
      const conversations = venueRow.conversations?.length || 0;
      const healthScore = Math.min(100, Math.round((tourViews * 0.3 + conversations * 0.7) / 10));
      
      return {
        id: venueRow.id,
        name: venueRow.name,
        city: venueRow.city,
        tourViews,
        conversations,
        healthScore,
      };
    }).sort((a: any, b: any) => (b.tourViews + b.conversations) - (a.tourViews + a.conversations)).slice(0, 5) || [];

    // Geographic distribution
    const { data: cityData } = await supabase
      .from('venues')
      .select('city')
      .eq('is_active', true);

    const geographicDistribution = cityData?.reduce((acc: any[], venue) => {
      const existing = acc.find(item => item.city === venue.city);
      if (existing) {
        existing.venueCount += 1;
      } else {
        acc.push({
          city: venue.city,
          venueCount: 1,
          totalActivity: 0, // Would need to calculate from conversations/views
        });
      }
      return acc;
    }, []).sort((a: any, b: any) => b.venueCount - a.venueCount).slice(0, 10) || [];

    // Device analytics
    const { data: conversations } = await supabase
      .from('conversations')
      .select('user_agent')
      .not('user_agent', 'is', null);

    const deviceCounts = conversations?.reduce((acc: any, conv) => {
      const ua = conv.user_agent?.toLowerCase() || '';
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
    const deviceAnalytics = Object.entries(deviceCounts).map(([device, count]: [string, any]) => ({
      device,
      count,
      percentage: totalDeviceCount > 0 ? Math.round((count / totalDeviceCount) * 100) : 0,
    }));

    // Chatbot performance
    const { data: responseTimes } = await supabase
      .from('conversations')
      .select('response_time_ms')
      .not('response_time_ms', 'is', null);

    const averageResponseTime = responseTimes && responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, conv) => sum + (conv.response_time_ms || 0), 0) / responseTimes.length)
      : 0;

    const { data: sessions } = await supabase
      .from('conversations')
      .select('session_id');

    const totalSessions = new Set(sessions?.map(c => c.session_id) || []).size;

    return {
      topPerformingVenues,
      geographicDistribution,
      deviceAnalytics,
      chatbotPerformance: {
        averageResponseTime,
        totalSessions,
      },
    };
  } catch (error) {
    console.error('Error fetching customer engagement:', error);
    throw new Error('Failed to fetch customer engagement');
  }
}

// Get recent platform activity
export async function getRecentPlatformActivity(): Promise<PlatformActivity[]> {
  try {
    const activities: PlatformActivity[] = [];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Recent venue signups
    const { data: recentVenues } = await supabase
      .from('venues')
      .select('id, name, created_at')
      .eq('is_active', true)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    recentVenues?.forEach((venueRow) => {
      activities.push({
        id: `venue-${venueRow.id}`,
        type: 'venue_signup',
        title: 'New venue registered',
        description: `${venueRow.name} joined the platform`,
        venueName: venueRow.name,
        timestamp: venueRow.created_at,
      });
    });

    // Recent tour uploads
    const { data: recentTours } = await supabase
      .from('tours')
      .select(`
        id,
        title,
        created_at,
        venues (name)
      `)
      .eq('is_active', true)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    recentTours?.forEach((tour: any) => {
      activities.push({
        id: `tour-${tour.id}`,
        type: 'tour_upload',
        title: 'New tour uploaded',
        description: `${tour.title} by ${(tour as any).venues?.name}`,
        venueName: (tour as any).venues?.name,
        timestamp: tour.created_at,
      });
    });

    // Recent subscription changes
    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        plan_name,
        updated_at,
        venues (name)
      `)
      .gte('updated_at', oneWeekAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5);

    recentSubscriptions?.forEach((sub: any) => {
      activities.push({
        id: `sub-${sub.id}`,
        type: 'subscription_change',
        title: 'Subscription updated',
        description: `${sub.venues?.name} - ${sub.plan_name} (${sub.status})`,
        venueName: sub.venues?.name,
        timestamp: sub.updated_at,
        metadata: { plan: sub.plan_name, status: sub.status },
      });
    });

    // Recent payments
    const { data: recentPayments } = await supabase
      .from('invoices')
      .select(`
        id,
        amount_paid,
        created_at,
        venues (name)
      `)
      .eq('status', 'paid')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    recentPayments?.forEach((payment: any) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment_received',
        title: 'Payment received',
        description: `£${payment.amount_paid} from ${payment.venues?.name}`,
        venueName: payment.venues?.name,
        timestamp: payment.created_at,
        metadata: { amount: payment.amount_paid },
      });
    });

    // Sort all activities by timestamp and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('Error fetching recent platform activity:', error);
    throw new Error('Failed to fetch recent platform activity');
  }
}

// Get all dashboard data in one call
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const [metrics, health, revenue, engagement, recentActivity] = await Promise.all([
      getPlatformMetrics(),
      getPlatformHealth(),
      getRevenueAnalytics(),
      getCustomerEngagement(),
      getRecentPlatformActivity(),
    ]);

    return {
      metrics,
      health,
      revenue,
      engagement,
      recentActivity,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw new Error('Failed to fetch admin dashboard data');
  }
} 