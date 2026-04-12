import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { venueHasAnyCustomisedTourTraining } from '@/lib/chatbot-training-defaults';

export const dynamic = 'force-dynamic';

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const venueId = requestedVenueId || authResult.venueId;

    if (venueId !== authResult.venueId && authResult.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden venue scope' }, { status: 403 });
    }

    const sevenDaysAgo = getDateDaysAgo(7).toISOString();
    const thirtyDaysAgo = getDateDaysAgo(30).toISOString();

    const [
      tourViewRowsResult,
      domainRowsResult,
      conversationRowsResult,
      weeklyViewCountResult,
      activeTourCountResult,
      leadCountResult,
      billingRecordResult,
      planResult,
      subscriptionResult,
      dailyEmbedRowsResult,
      dailyTourMoveRowsResult,
      dailyConversationRowsResult,
      deviceRowsResult,
      actionVenueInfoResult,
      actionTourResult,
      actionChatbotResult,
      activeTourChatbotConfigsResult,
      actionRecentConversationCountResult,
      venuePressedShareResult,
    ] = await Promise.all([
      supabase.from('embed_stats').select('views_count').eq('venue_id', venueId).eq('embed_type', 'tour'),
      supabase.from('embed_stats').select('domain').eq('venue_id', venueId).eq('embed_type', 'tour').not('domain', 'is', null),
      supabase.from('conversations').select('conversation_id, created_at, message_type, user_agent, domain').eq('venue_id', venueId),
      supabase.from('embed_stats').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).eq('embed_type', 'tour').gte('created_at', sevenDaysAgo),
      supabase.from('tours').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).eq('is_active', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('venue_id', venueId),
      supabase.from('venue_billing_records').select('*').eq('venue_id', venueId).maybeSingle(),
      supabase.from('billing_plans').select('code, included_spaces, included_messages').eq('is_active', true),
      supabase.from('subscriptions').select('status, plan_name, current_price, billing_cycle, is_trial, trial_end_date, next_billing_date').eq('venue_id', venueId).maybeSingle(),
      supabase.from('embed_stats').select('created_at').eq('venue_id', venueId).eq('embed_type', 'tour').gte('created_at', sevenDaysAgo),
      supabase.from('embed_tour_moves').select('created_at').eq('venue_id', venueId).gte('created_at', sevenDaysAgo),
      supabase.from('conversations').select('created_at, message_type').eq('venue_id', venueId).gte('created_at', sevenDaysAgo),
      supabase.from('embed_stats').select('user_agent').eq('venue_id', venueId).eq('embed_type', 'tour').not('user_agent', 'is', null),
      supabase.from('venue_information').select('id').eq('venue_id', venueId).maybeSingle(),
      supabase.from('tours').select('id').eq('venue_id', venueId).eq('is_active', true).maybeSingle(),
      supabase.from('chatbot_configs').select('id').eq('venue_id', venueId).limit(1),
      supabase.from('chatbot_configs').select('id').eq('venue_id', venueId).eq('is_active', true),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).gte('created_at', thirtyDaysAgo),
      supabase.from('venues').select('pressed_share').eq('id', venueId).maybeSingle(),
    ]);

    const tourViewRows = tourViewRowsResult.data || [];
    const totalTourViews = tourViewRows.reduce((sum, row) => sum + Number(row.views_count || 0), 0);

    const { count: totalTourMovesCount, error: totalTourMovesError } = await supabase
      .from('embed_tour_moves')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);
    if (totalTourMovesError) {
      console.error('Error counting embed_tour_moves for dashboard:', totalTourMovesError);
    }
    const totalTourMoves = totalTourMovesCount || 0;

    const conversationRows = conversationRowsResult.data || [];
    const uniqueConversationIds = new Set(conversationRows.map((row) => row.conversation_id).filter(Boolean));
    const totalTourConversations = uniqueConversationIds.size;
    const visitorMessages = conversationRows.filter((row) => row.message_type === 'visitor').length;
    const uniqueDomains = new Set((domainRowsResult.data || []).map((row) => row.domain).filter(Boolean)).size;
    const engagementRate = totalTourViews > 0 ? (totalTourConversations / totalTourViews) * 100 : 0;

    const activeChatbotConfigIds =
      activeTourChatbotConfigsResult.data?.map((r) => r.id).filter(Boolean) ?? [];
    const hasActiveTourChatbot = activeChatbotConfigIds.length > 0;

    let hasCustomisedTourTraining = false;
    if (activeChatbotConfigIds.length > 0) {
      const { data: trainingSections, error: trainingSectionsError } = await supabase
        .from('chatbot_info_sections')
        .select('id, chatbot_config_id, section_key, section_title, is_active')
        .in('chatbot_config_id', activeChatbotConfigIds);
      if (trainingSectionsError) {
        console.error('Dashboard training sections:', trainingSectionsError);
      }
      const trainingSectionIds = trainingSections?.map((s) => s.id).filter(Boolean) ?? [];
      let trainingFields: Array<{
        section_id: string;
        field_key: string;
        field_label: string;
        field_type: string;
        field_value: string | null;
        display_order: number | null;
        is_required: boolean | null;
      }> = [];
      if (trainingSectionIds.length > 0) {
        const { data: tf, error: trainingFieldsError } = await supabase
          .from('chatbot_info_fields')
          .select(
            'section_id, field_key, field_label, field_type, field_value, display_order, is_required'
          )
          .in('section_id', trainingSectionIds);
        if (trainingFieldsError) {
          console.error('Dashboard training fields:', trainingFieldsError);
        }
        trainingFields = tf ?? [];
      }
      hasCustomisedTourTraining = venueHasAnyCustomisedTourTraining(
        activeChatbotConfigIds,
        trainingSections ?? [],
        trainingFields
      );
    }

    const billingRecord = billingRecordResult.data;
    const allPlans = planResult.data || [];
    const planCode =
      billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
        ? billingRecord.override_plan_code
        : billingRecord?.plan_code || 'free';
    const activePlan = allPlans.find((plan) => plan.code === planCode) || null;

    const baseSpacesFromPlan = Number(activePlan?.included_spaces || 0);
    const baseSpaces = Math.max(baseSpacesFromPlan, planCode === 'free' ? 1 : 0);
    const baseMessages = Number(activePlan?.included_messages || 0);
    const addonExtraSpaces = Number(billingRecord?.addon_extra_spaces || 0);
    const addonMessageBlocks = Number(billingRecord?.addon_message_blocks || 0);

    const spacesLimit = Number(
      billingRecord?.effective_space_limit ?? (baseSpaces + addonExtraSpaces)
    );
    const messageCreditsLimit = Number(
      billingRecord?.effective_message_limit ??
        (baseMessages + addonExtraSpaces * 1000 + addonMessageBlocks * 1000)
    );

    const dailyMap: Record<string, { tourViews: number; tourMoves: number; chatMessages: number }> = {};
    for (let i = 6; i >= 0; i -= 1) {
      const date = getDateDaysAgo(i);
      const key = date.toISOString().slice(0, 10);
      dailyMap[key] = { tourViews: 0, tourMoves: 0, chatMessages: 0 };
    }

    (dailyEmbedRowsResult.data || []).forEach((row) => {
      const key = String(row.created_at).slice(0, 10);
      if (dailyMap[key]) dailyMap[key].tourViews += 1;
    });

    (dailyTourMoveRowsResult.data || []).forEach((row) => {
      const key = String(row.created_at).slice(0, 10);
      if (dailyMap[key]) dailyMap[key].tourMoves += 1;
    });

    (dailyConversationRowsResult.data || []).forEach((row) => {
      const key = String(row.created_at).slice(0, 10);
      if (dailyMap[key] && row.message_type === 'visitor') dailyMap[key].chatMessages += 1;
    });

    const dailyData = Object.entries(dailyMap).map(([key, value]) => {
      const date = new Date(`${key}T00:00:00.000Z`);
      return {
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        tourViews: value.tourViews,
        tourMoves: value.tourMoves,
        chatMessages: value.chatMessages,
      };
    });

    const deviceCounts = (deviceRowsResult.data || []).reduce(
      (acc, row) => {
        const ua = String(row.user_agent || '').toLowerCase();
        let label = 'Desktop';
        if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) label = 'Mobile';
        else if (/tablet|ipad|playbook|silk/i.test(ua)) label = 'Tablet';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const totalDevices = Object.values(deviceCounts).reduce((a, b) => a + b, 0);
    const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0,
    }));

    const domainViewCounts = (domainRowsResult.data || []).reduce(
      (acc, row) => {
        const domain = row.domain;
        if (!domain) return acc;
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const domainConversationSets = conversationRows.reduce(
      (acc, row) => {
        if (!row.domain || !row.conversation_id) return acc;
        if (!acc[row.domain]) acc[row.domain] = new Set<string>();
        acc[row.domain].add(row.conversation_id);
        return acc;
      },
      {} as Record<string, Set<string>>
    );
    const topDomains = Object.entries(domainViewCounts)
      .map(([domain, views]) => ({
        domain,
        views,
        conversations: domainConversationSets[domain]?.size || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const actionItems = [];
    if (!actionVenueInfoResult.data?.id) {
      actionItems.push({
        id: 'venue-info-setup',
        title: 'Complete venue information',
        description: 'Add detailed information about your venue to improve chatbot responses',
        priority: 'high',
        type: 'setup',
        actionUrl: '/app/chatbots',
        completed: false,
      });
    }
    if (!actionTourResult.data?.id) {
      actionItems.push({
        id: 'tour-setup',
        title: 'Create Virtual Tour',
        description: 'Set up your virtual tour to showcase your venue to potential members',
        priority: 'high',
        type: 'content',
        actionUrl: '/app/tours',
        completed: false,
      });
    }
    if (!(actionChatbotResult.data || []).length) {
      actionItems.push({
        id: 'chatbot-setup',
        title: 'Configure Chatbot',
        description: 'Set up your tour chatbot to engage with visitors',
        priority: 'high',
        type: 'setup',
        actionUrl: '/app/chatbots',
        completed: false,
      });
    }
    if (Number(actionRecentConversationCountResult.count || 0) < 5) {
      actionItems.push({
        id: 'promote-chatbot',
        title: 'Promote Your Chatbot',
        description: 'Share your chatbot on social media or your website to increase engagement',
        priority: 'medium',
        type: 'engagement',
        actionUrl: '/app/chatbots',
        completed: false,
      });
    }
    if (!subscriptionResult.data || subscriptionResult.data.status !== 'active') {
      actionItems.push({
        id: 'subscription-setup',
        title: 'Activate Subscription',
        description: 'Complete your subscription setup to unlock all features',
        priority: 'high',
        type: 'billing',
        actionUrl: '/app/settings',
        completed: false,
      });
    }

    return NextResponse.json({
      overview: {
        totalTourViews: Number(totalTourViews) || 0,
        totalTourMoves: Number(totalTourMoves) || 0,
        totalTourConversations: Number(totalTourConversations) || 0,
        tourChatEngagementRate: Number(engagementRate.toFixed(1)) || 0,
        uniqueDomains: Number(uniqueDomains) || 0,
      },
      quickStats: {
        viewsThisWeek: Number(weeklyViewCountResult.count || 0),
        tourChatMessages: Number(visitorMessages || 0),
        messageCreditsUsed: Number(visitorMessages || 0),
        messageCreditsLimit: Number(messageCreditsLimit || 0),
        spacesUsed: Number(activeTourCountResult.count || 0),
        spacesLimit: Number(spacesLimit || 1),
        uniqueDomains: Number(uniqueDomains) || 0,
        totalLeads: Number(leadCountResult.count || 0),
        avgResponseTime: 0,
        subscriptionStatus: subscriptionResult.data?.status || 'pending',
        subscriptionDetails: subscriptionResult.data
          ? {
              planName: subscriptionResult.data.plan_name || null,
              currentPrice: subscriptionResult.data.current_price || null,
              billingCycle: subscriptionResult.data.billing_cycle || null,
              isTrial: Boolean(subscriptionResult.data.is_trial),
              trialDaysRemaining: null,
              trialEndDate: subscriptionResult.data.trial_end_date || null,
            }
          : null,
        venueInfoCompleteness: actionVenueInfoResult.data?.id ? 100 : 0,
        hasActiveTourChatbot,
        hasCustomisedTourTraining,
        pressedShare: Boolean(venuePressedShareResult.data?.pressed_share),
      },
      visitorAnalytics: {
        totalTourViews: Number(totalTourViews) || 0,
        totalTourMoves: Number(totalTourMoves) || 0,
        totalChatInteractions: Number(visitorMessages || 0),
        dailyData,
        deviceBreakdown,
        topDomains,
      },
      recentActivity: [],
      performanceMetrics: {
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        popularTourSections: [],
        chatbotEffectiveness: {
          totalQueries: Number(visitorMessages || 0),
          resolvedQueries: Number(totalTourConversations || 0),
        },
      },
      revenueMetrics: {
        currentMonthRevenue: 0,
        lastMonthRevenue: 0,
        revenueGrowth: 0,
        totalRevenue: 0,
        monthlyData: [],
        subscriptionBreakdown: [],
      },
      actionItems,
    });
  } catch (error: any) {
    console.error('Error fetching app dashboard data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
