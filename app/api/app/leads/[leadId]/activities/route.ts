import { NextRequest, NextResponse } from 'next/server';
import { getLeadActivities, createLeadActivity } from '@/lib/leads/lead-activity-service';
import { getLeadById } from '@/lib/leads/lead-service';
import { getUserWithVenue } from '@/lib/user-service';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

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

// GET /api/app/leads/[leadId]/activities - Get activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId } = authResult;

    // Verify lead exists and belongs to this venue
    const lead = await getLeadById(leadId, venueId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get activities
    const activities = await getLeadActivities(leadId);

    return NextResponse.json({ data: activities });
  } catch (error: any) {
    console.error('Error fetching lead activities:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead activities' },
      { status: 500 }
    );
  }
}

// POST /api/app/leads/[leadId]/activities - Create new activity for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId, userId } = authResult;
    const body = await request.json();

    // Verify lead exists and belongs to this venue
    const lead = await getLeadById(leadId, venueId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.activity_type) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      );
    }

    // Validate activity type
    const validActivityTypes = ['email_sent', 'call_made', 'note_added', 'status_changed', 'lead_created'];
    if (!validActivityTypes.includes(body.activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Create activity
    const newActivity = await createLeadActivity(
      leadId,
      body.activity_type,
      body.description || null,
      body.performed_by || userId, // Default to current user
      body.metadata || null
    );

    if (!newActivity) {
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Activity created successfully',
        data: newActivity
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lead activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead activity' },
      { status: 500 }
    );
  }
} 