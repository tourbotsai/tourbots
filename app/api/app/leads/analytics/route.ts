import { NextRequest, NextResponse } from 'next/server';
import { getLeadDashboardData } from '@/lib/leads/lead-analytics-service';
import { getUserWithVenue } from '@/lib/user-service';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

// Initialize Firebase Admin
initAdmin();
const auth = getAuth();

// Helper function to authenticate user and get venue ID
async function authenticateAndGetVenueId(request: NextRequest): Promise<{ venueId: string; userId: string } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user with venue information
    const userWithVenue = await getUserWithVenue(decodedToken.uid);
    
    if (!userWithVenue) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userWithVenue.venue_id) {
      return NextResponse.json(
        { error: 'User not associated with a venue' },
        { status: 403 }
      );
    }

    return { venueId: userWithVenue.venue_id, userId: userWithVenue.id };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}

// GET /api/app/leads/analytics - Get comprehensive lead analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId } = authResult;
    const { searchParams } = new URL(request.url);
    
    // Get analytics type from query params
    const type = searchParams.get('type');

    // Get comprehensive dashboard data
    const dashboardData = await getLeadDashboardData(venueId);

    // Return specific data type if requested
    if (type) {
      switch (type) {
        case 'metrics':
          return NextResponse.json({ data: dashboardData.metrics });
        case 'source':
          return NextResponse.json({ data: dashboardData.sourceAnalytics });
        case 'timeseries':
          return NextResponse.json({ data: dashboardData.timeSeriesData });
        case 'insights':
          return NextResponse.json({ data: dashboardData.insights });
        case 'funnel':
          return NextResponse.json({ data: dashboardData.funnelAnalytics });
        default:
          return NextResponse.json(
            { error: 'Invalid analytics type. Use: metrics, source, timeseries, insights, or funnel' },
            { status: 400 }
          );
      }
    }

    // Return all analytics data by default
    return NextResponse.json({ data: dashboardData });
  } catch (error: any) {
    console.error('Error fetching lead analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead analytics' },
      { status: 500 }
    );
  }
} 