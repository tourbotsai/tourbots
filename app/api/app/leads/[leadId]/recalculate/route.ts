import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { calculateAndUpdateLeadScore } from '@/lib/services/lead-scoring-service';
import { getUserWithVenue } from '@/lib/user-service';

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

// POST /api/app/leads/[leadId]/recalculate - Recalculate lead score
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId, userId } = authResult;
    const { leadId } = params;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Recalculate and update lead score
    const result = await calculateAndUpdateLeadScore(
      leadId,
      venueId,
      userId,
      'manual_update'
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Lead not found or failed to update score' },
        { status: 404 }
      );
    }

    const { lead, scoringResult } = result;

    return NextResponse.json({
      success: true,
      data: {
        lead,
        scoring: {
          score: scoringResult.score,
          previous_score: scoringResult.previousScore,
          score_change: scoringResult.scoreChange,
          method: scoringResult.method
        }
      },
      message: `Lead score recalculated successfully: ${scoringResult.previousScore} → ${scoringResult.score}/100 (${scoringResult.scoreChange >= 0 ? '+' : ''}${scoringResult.scoreChange})`
    });

  } catch (error: any) {
    console.error('Error in POST /api/app/leads/[leadId]/recalculate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate lead score' },
      { status: 500 }
    );
  }
} 