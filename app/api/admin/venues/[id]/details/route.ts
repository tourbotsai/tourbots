import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

/**
 * Get comprehensive venue details for admin view
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const venueId = params.id;

    // Fetch all venue data in parallel
    const [
      venueRowResult,
      subscriptionResult,
      billingRecordResult,
      billingPlansResult,
      billingAddonsResult,
      toursResult,
      chatbotConfigsResult,
      leadsResult,
      paymentLinksResult,
      venueInfoTableResult,
      usersResult,
      embedStatsResult,
      conversationsResult,
    ] = await Promise.all([
      // 1. Basic venue row
      supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single(),

      // 2. Subscription data
      supabase
        .from('subscriptions')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle(),

      // 2b. Billing record (new billing system)
      supabase
        .from('venue_billing_records')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle(),

      // 2c. Billing plans catalogue
      supabase
        .from('billing_plans')
        .select('code, name, monthly_price_gbp, included_spaces, included_messages')
        .eq('is_active', true),

      // 2d. Billing add-ons catalogue
      supabase
        .from('billing_addons')
        .select('code, name, monthly_price_gbp')
        .eq('is_active', true),

      // 3. Tours with analytics
      supabase
        .from('tours')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false }),

      // 4. Chatbot configs (ONLY - don't combine with customisations)
      supabase
        .from('chatbot_configs')
        .select('*')
        .eq('venue_id', venueId),

      // 5. Leads (recent 10)
      supabase
        .from('leads')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(10),

      // 6. Payment links
      supabase
        .from('payment_links')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false }),

      // 7. Venue information (AI knowledge)
      supabase
        .from('venue_information')
        .select('*')
        .eq('venue_id', venueId)
        .maybeSingle(),

      // 7. Associated users (anyone with this venue_id)
      supabase
        .from('users')
        .select('id, email, first_name, last_name, role, phone, profile_image_url, is_active, created_at, venue_id')
        .eq('venue_id', venueId),

      // 9. Embed stats (tour views, chatbot usage)
      supabase
        .from('embed_stats')
        .select('*')
        .eq('venue_id', venueId),

      // 10. Recent conversations (last 50 messages to group by conversation_id)
      supabase
        .from('conversations')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (venueRowResult.error || !venueRowResult.data) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Get lead stats
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    const { count: convertedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('lead_status', 'converted');

    // Billing message usage should match app/dashboard logic:
    // only visitor messages sent to the tour chatbot.
    const { count: tourVisitorMessagesUsed } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('chatbot_type', 'tour')
      .eq('message_type', 'visitor');

    // Get chatbots from configs only (don't duplicate with customisations)
    const chatbots = chatbotConfigsResult.data || [];

    // Calculate tour analytics PROPERLY
    const embedStats = embedStatsResult.data || [];
    
    // Tour views: sum of all views_count for tour embeds (NOTE: column is views_count, not view_count!)
    const tourViews = embedStats
      .filter((s: any) => s.embed_type === 'tour')
      .reduce((sum: number, s: any) => sum + (s.views_count || 0), 0);
    
    // Embed count: count DISTINCT embed_id (unique embeds, not view records)
    const uniqueTourEmbeds = new Set(
      embedStats
        .filter((s: any) => s.embed_type === 'tour')
        .map((s: any) => s.embed_id)
    );
    
    // Process conversations: group by conversation_id and count messages
    const allMessages = conversationsResult.data || [];
    const conversationMap = new Map();
    
    allMessages.forEach((msg: any) => {
      const convId = msg.conversation_id;
      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          id: convId,
          venue_id: msg.venue_id,
          chatbot_type: msg.chatbot_type,
          session_id: msg.session_id,
          visitor_id: msg.visitor_id,
          created_at: msg.created_at,
          messages: [],
          message_count: 0,
        });
      }
      const conv = conversationMap.get(convId);
      conv.messages.push(msg);
      conv.message_count++;
      // Keep the earliest created_at as conversation start
      if (new Date(msg.created_at) < new Date(conv.created_at)) {
        conv.created_at = msg.created_at;
      }
    });
    
    // Convert to array and get last message for each conversation
    const groupedConversations = Array.from(conversationMap.values()).map((conv: any) => {
      // Sort messages by created_at to get last message
      const sortedMessages = conv.messages.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMessages[0];
      
      return {
        ...conv,
        last_message: lastMsg.message || lastMsg.response,
        visitor_email: lastMsg.visitor_id, // visitor_id often contains email
      };
    });
    
    // Sort conversations by most recent first
    groupedConversations.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Total chatbot messages across all conversations
    const chatbotMessages = allMessages.length;

    // Build response
    const billingRecord = billingRecordResult.data || null;
    const billingPlans = billingPlansResult.data || [];
    const activePlanCode =
      billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
        ? billingRecord.override_plan_code
        : (billingRecord?.plan_code || null);
    const activePlan = activePlanCode
      ? billingPlans.find((plan: any) => plan.code === activePlanCode) || null
      : null;

    const response = {
      venue: venueRowResult.data,
      subscription: subscriptionResult.data || null,
      billing: {
        record: billingRecord,
        activePlan,
        addons: billingAddonsResult.data || [],
        usage: {
          messageCreditsUsed: Number(tourVisitorMessagesUsed || 0),
        },
      },
      tours: toursResult.data || [],
      embedStats,
      tourStats: {
        totalViews: tourViews,
        embedCount: uniqueTourEmbeds.size, // FIXED: Count unique embeds, not stats records
      },
      chatbots: chatbots,
      chatbotStats: {
        totalMessages: chatbotMessages, // FIXED: Total individual messages
        activeConfigs: chatbots.filter((c: any) => c.is_active).length,
      },
      conversations: groupedConversations.slice(0, 20), // Return top 20 most recent conversations
      leads: leadsResult.data || [],
      leadStats: {
        total: totalLeads || 0,
        converted: convertedLeads || 0,
        conversionRate: totalLeads && totalLeads > 0
          ? Math.round((convertedLeads || 0) / totalLeads * 100)
          : 0,
      },
      paymentLinks: paymentLinksResult.data || [],
      venueInformation: venueInfoTableResult.data || null,
      users: usersResult.data || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching venue details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch venue details' },
      { status: 500 }
    );
  }
}
