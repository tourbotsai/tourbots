import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();

interface AuthContext {
  venueId: string;
  role: string;
}

async function authenticateAndGetContext(request: NextRequest): Promise<AuthContext | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);

    const { data: user, error } = await supabase
      .from('users')
      .select('venue_id, role')
      .eq('firebase_uid', decodedToken.uid)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.venue_id) {
      return NextResponse.json({ error: 'User not associated with a venue' }, { status: 403 });
    }

    return {
      venueId: user.venue_id,
      role: user.role || 'admin',
    };
  } catch (error) {
    console.error('Tour analytics auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await authenticateAndGetContext(request);
    if (authContext instanceof NextResponse) return authContext;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const tourId = searchParams.get('tourId');

    if (!requestedVenueId || !tourId) {
      return NextResponse.json({ error: 'venueId and tourId are required' }, { status: 400 });
    }

    const isPlatformAdmin = authContext.role === 'platform_admin';
    if (!isPlatformAdmin && requestedVenueId !== authContext.venueId) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    const scopedVenueId = isPlatformAdmin ? requestedVenueId : authContext.venueId;

    const withScope = (query: any) => query.eq('venue_id', scopedVenueId).eq('tour_id', tourId);

    const [tourViewsResult, uniqueDomainRows, sampleDataResult, tourChatMessagesResult, conversationIdsResult] =
      await Promise.all([
        withScope(
          supabase
            .from('embed_stats')
            .select('*', { count: 'exact', head: true })
            .eq('embed_type', 'tour')
        ),
        withScope(
          supabase
            .from('embed_stats')
            .select('domain')
            .not('domain', 'is', null)
        ),
        withScope(
          supabase
            .from('embed_stats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500)
        ),
        withScope(
          supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('chatbot_type', 'tour')
            .eq('message_type', 'visitor')
        ),
        withScope(
          supabase
            .from('conversations')
            .select('conversation_id')
            .eq('chatbot_type', 'tour')
        ),
      ]);

    const domainRows = (uniqueDomainRows.data || []) as Array<{ domain: string | null }>;
    const uniqueDomains = Array.from(new Set(domainRows.map((row) => row.domain).filter(Boolean))).length;

    const conversationRows = (conversationIdsResult.data || []) as Array<{ conversation_id: string | null }>;
    const uniqueConversations = new Set(
      conversationRows.map((row) => row.conversation_id).filter(Boolean)
    ).size;

    return NextResponse.json({
      data: sampleDataResult.data || [],
      summary: {
        tourViews: tourViewsResult.count || 0,
        totalConversations: uniqueConversations,
        tourChatMessages: tourChatMessagesResult.count || 0,
        uniqueDomains,
      },
    });
  } catch (error: any) {
    console.error('Error fetching tour analytics:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch tour analytics' },
      { status: 500 }
    );
  }
}

