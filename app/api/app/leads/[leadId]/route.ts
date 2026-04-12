import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead, deleteLead } from '@/lib/leads/lead-service';
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

// GET /api/app/leads/[leadId] - Get specific lead
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

    // Get lead
    const lead = await getLeadById(leadId, venueId);

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: lead });
  } catch (error: any) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/app/leads/[leadId] - Update specific lead
export async function PUT(
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
    const body = await request.json();

    // Validate email format if provided
    if (body.visitor_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.visitor_email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate interest level if provided
    if (body.interest_level && !['high', 'medium', 'low'].includes(body.interest_level)) {
      return NextResponse.json(
        { error: 'Interest level must be high, medium, or low' },
        { status: 400 }
      );
    }

    // Validate lead status if provided
    if (body.lead_status && !['new', 'contacted', 'qualified', 'converted', 'lost'].includes(body.lead_status)) {
      return NextResponse.json(
        { error: 'Invalid lead status' },
        { status: 400 }
      );
    }

    // Validate chatbot type if provided
    if (body.chatbot_type && body.chatbot_type !== 'tour') {
      return NextResponse.json(
        { error: 'Chatbot type must be tour' },
        { status: 400 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    
    const allowedFields = [
      'visitor_name', 'visitor_email', 'visitor_phone', 'lead_status',
      'interest_level', 'lead_score', 'lead_notes', 'conversation_context',
      'interests', 'follow_up_date', 'assigned_to', 'last_contacted_at'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Update lead
    const updatedLead = await updateLead(leadId, venueId, updateData);

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Lead updated successfully',
      data: updatedLead
    });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/app/leads/[leadId] - Delete specific lead
export async function DELETE(
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

    // Delete lead
    const success = await deleteLead(leadId, venueId);

    if (!success) {
      return NextResponse.json(
        { error: 'Lead not found or deletion failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Lead deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
} 