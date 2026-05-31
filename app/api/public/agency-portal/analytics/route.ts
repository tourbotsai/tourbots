import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import {
  getScopedTourAnalyticsSessionMessages,
  getScopedTourAnalyticsSessions,
  getScopedTourAnalyticsStats,
  getScopedTourAnalyticsTrend,
  getScopedTourConversations,
  getScopedTourEmbedStats,
} from '@/lib/agency-portal-module-service';
import { checkClientAllocationUsage } from '@/lib/services/agency-allocation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;
    const view = searchParams.get('view') || 'stats';
    const sessionId = searchParams.get('sessionId');
    const limit = Number(searchParams.get('limit') || 50);

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'analytics',
    });
    if (session instanceof NextResponse) return session;

    if (view === 'sessions') {
      const sessions = await getScopedTourAnalyticsSessions(session.venueId, session.tourId, limit);
      return NextResponse.json({ sessions });
    }

    if (view === 'details') {
      const [trend, embedStats, conversations] = await Promise.all([
        getScopedTourAnalyticsTrend(session.venueId, session.tourId, 90),
        getScopedTourEmbedStats(session.venueId, session.tourId),
        getScopedTourConversations(session.venueId, session.tourId),
      ]);
      return NextResponse.json({ trend, embedStats, conversations });
    }

    if (view === 'messages') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required for messages view.' }, { status: 400 });
      }
      const messages = await getScopedTourAnalyticsSessionMessages(
        session.venueId,
        session.tourId,
        sessionId
      );
      return NextResponse.json({ messages });
    }

    const [stats, allocationResult] = await Promise.all([
      getScopedTourAnalyticsStats(session.venueId, session.tourId),
      checkClientAllocationUsage(session.venueId, session.tourId),
    ]);

    // Only surface allocation to the client when the agency runs in allocated mode.
    const allocation = allocationResult.enforced
      ? {
          used: allocationResult.used,
          allocation: allocationResult.allocation,
          remaining: allocationResult.remaining,
          resetAt: allocationResult.resetAt,
        }
      : null;

    return NextResponse.json({ stats, allocation });
  } catch (error: any) {
    console.error('Agency portal analytics GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portal analytics.' },
      { status: 500 }
    );
  }
}

