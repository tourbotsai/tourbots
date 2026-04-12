import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead, LeadFilters } from '@/lib/leads/lead-service';
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

// GET /api/app/leads - List leads with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    
    // Build filters
    const filters: LeadFilters = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',');
    }
    
    if (searchParams.get('chatbot_type')) {
      const chatbotTypes = searchParams.get('chatbot_type')!.split(',');
      if (chatbotTypes.every((type) => type === 'tour')) {
        filters.chatbot_type = chatbotTypes;
      }
    }
    
    if (searchParams.get('interest_level')) {
      filters.interest_level = searchParams.get('interest_level')!.split(',');
    }
    
    if (searchParams.get('date_from')) {
      filters.date_from = searchParams.get('date_from')!;
    }
    
    if (searchParams.get('date_to')) {
      filters.date_to = searchParams.get('date_to')!;
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    
    if (searchParams.get('lead_score_min')) {
        filters.lead_score_min = parseInt(searchParams.get('lead_score_min')!);
    }

    if (searchParams.get('lead_score_max')) {
        filters.lead_score_max = parseInt(searchParams.get('lead_score_max')!);
    }

    // Get leads
    const result = await getLeads(venueId, filters, page, limit);

    return NextResponse.json({
      data: result.leads,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/app/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.visitor_name || !body.visitor_email) {
      return NextResponse.json(
        { error: 'Visitor name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.visitor_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate interest level if provided
    if (body.interest_level && !['high', 'medium', 'low'].includes(body.interest_level)) {
      return NextResponse.json(
        { error: 'Interest level must be high, medium, or low' },
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

    // Validate venue_id is provided in the request body
    if (!body.venue_id) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Prepare lead data
    const leadData = {
      venue_id: body.venue_id,
      visitor_name: body.visitor_name,
      visitor_email: body.visitor_email,
      visitor_phone: body.visitor_phone || null,
      chatbot_type: body.chatbot_type || null,
      conversation_id: body.conversation_id || null,
      session_id: body.session_id || null,
      source: body.source || 'manual',
      lead_status: body.lead_status || 'new',
      interest_level: body.interest_level || null,
      lead_score: body.lead_score || 0,
      lead_notes: body.lead_notes || null,
      conversation_context: body.conversation_context || null,
      interests: body.interests || null,
      ip_address: body.ip_address || null,
      user_agent: body.user_agent || null,
      page_url: body.page_url || null,
      utm_source: body.utm_source || null,
      utm_campaign: body.utm_campaign || null,
      follow_up_date: body.follow_up_date || null,
      assigned_to: body.assigned_to || null,
      last_contacted_at: body.last_contacted_at || null
    };

    // Create lead
    const newLead = await createLead(leadData);

    if (!newLead) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Lead created successfully',
        data: newLead 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
} 