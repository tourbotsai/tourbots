import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  ensureTourScope,
  ensureVenueScope,
} from '@/lib/chatbot-route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const tourId = searchParams.get('tourId');
    const sessionId = searchParams.get('sessionId');
    const chatbotType = searchParams.get('chatbotType');
    const type = searchParams.get('type'); // 'conversations' | 'stats' | 'session'
    const venueId = authResult.venueId;

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;
    if (tourId) {
      const tourScopeError = await ensureTourScope(venueId, tourId);
      if (tourScopeError) return tourScopeError;
    }

    if (type === 'stats') {
      // Get all conversations to calculate proper stats
      let allConversationsQuery = supabase
        .from('conversations')
        .select('conversation_id, chatbot_type, venue_id, message_type, venues(name)');
      
      if (venueId) {
        allConversationsQuery = allConversationsQuery.eq('venue_id', venueId);
      }
      if (tourId) {
        allConversationsQuery = allConversationsQuery.eq('tour_id', tourId);
      }

      if (chatbotType) {
        allConversationsQuery = allConversationsQuery.eq('chatbot_type', chatbotType);
      }

      const { data: allConversations, error: allConversationsError } = await allConversationsQuery;

      if (allConversationsError) throw allConversationsError;

      // Count unique conversations (not total rows)
      const uniqueConversations = new Set(allConversations?.map(conv => conv.conversation_id) || []);
      const totalConversations = uniqueConversations.size;

      // Count total user messages (only visitor messages, not bot responses)
      const totalMessages = allConversations?.filter(conv => conv.message_type === 'visitor').length || 0;

      // Get all sessions to count unique sessions
      let sessionsQuery = supabase
        .from('conversations')
        .select('session_id');
      
      if (venueId) {
        sessionsQuery = sessionsQuery.eq('venue_id', venueId);
      }
      if (tourId) {
        sessionsQuery = sessionsQuery.eq('tour_id', tourId);
      }

      if (chatbotType) {
        sessionsQuery = sessionsQuery.eq('chatbot_type', chatbotType);
      }

      const { data: allSessions, error: sessionsError } = await sessionsQuery;

      if (sessionsError) throw sessionsError;

      // Count unique sessions
      const uniqueSessions = new Set(allSessions?.map(conv => conv.session_id) || []);

      // Group conversations by venue (not messages)
      const venueConversationCounts = allConversations?.reduce((acc: any, conv: any) => {
        const venueName = conv.venues?.name || 'Unknown';
        const type = conv.chatbot_type || 'tour';
        const key = `${venueName} (${type})`;
        
        // Only count unique conversations
        if (!acc.seen) acc.seen = new Set();
        const convKey = `${conv.conversation_id}-${venueName}-${type}`;
        if (!acc.seen.has(convKey)) {
          acc.seen.add(convKey);
        acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      // Remove the 'seen' tracking from the response
      delete venueConversationCounts.seen;

      return NextResponse.json({
        totalMessages: totalMessages,
        totalConversations: totalConversations,
        totalSessions: uniqueSessions.size,
        venueStats: venueConversationCounts,
      });
    }

    if (type === 'session' && sessionId) {
      // Get messages for a specific session
      let sessionQuery = supabase
        .from('conversations')
        .select(`
          *,
          venues (
            id,
            name
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (venueId) {
        sessionQuery = sessionQuery.eq('venue_id', venueId);
      }
      if (tourId) {
        sessionQuery = sessionQuery.eq('tour_id', tourId);
      }

      if (chatbotType) {
        sessionQuery = sessionQuery.eq('chatbot_type', chatbotType);
      }

      const { data, error } = await sessionQuery;

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // Get conversations with optional filtering
    let query = supabase
      .from('conversations')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }
    if (tourId) {
      query = query.eq('tour_id', tourId);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (chatbotType) {
      query = query.eq('chatbot_type', chatbotType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 