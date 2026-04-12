import { NextRequest, NextResponse } from 'next/server';
import { exportLeads, LeadFilters } from '@/lib/leads/lead-service';
import { getUserWithVenue } from '@/lib/user-service';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { EXPORT_FORMATS } from '@/lib/constants/lead-constants';

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

// Helper function to convert leads to CSV format
function convertLeadsToCSV(leads: any[]): string {
  if (leads.length === 0) {
    return 'No leads to export';
  }

  // Define CSV headers
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Source',
    'Chatbot Type',
    'Status',
    'Interest Level',
    'Lead Score',
    'Notes',
    'Interests',
    'Created Date',
    'Last Updated'
  ];

  // Convert leads to CSV rows
  const rows = leads.map(lead => [
    lead.visitor_name || '',
    lead.visitor_email || '',
    lead.visitor_phone || '',
    lead.source || '',
    lead.chatbot_type || '',
    lead.lead_status || '',
    lead.interest_level || '',
    lead.lead_score || 0,
    lead.lead_notes || '',
    Array.isArray(lead.interests) ? lead.interests.join('; ') : '',
    new Date(lead.created_at).toLocaleDateString('en-GB'),
    new Date(lead.updated_at).toLocaleDateString('en-GB')
  ]);

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');

  return csvContent;
}

// GET /api/app/leads/export - Export leads to CSV
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId } = authResult;
    const { searchParams } = new URL(request.url);

    // Parse query parameters for filtering
    const filters: LeadFilters = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',');
    }
    
    if (searchParams.get('chatbot_type')) {
      filters.chatbot_type = searchParams.get('chatbot_type')!.split(',');
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

    // Get export format (default to CSV)
    const format = searchParams.get('format') || 'csv';
    
    // Validate format
    const validFormats = Object.values(EXPORT_FORMATS);
    if (!validFormats.includes(format as any)) {
      return NextResponse.json(
        { error: `Invalid format. Supported formats: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Export leads
    const leads = await exportLeads(venueId, filters);

    if (format === 'json') {
      // Return JSON format
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.json`;
      
      return new NextResponse(JSON.stringify(leads, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return CSV format
      const csvContent = convertLeadsToCSV(leads);
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export leads' },
      { status: 500 }
    );
  }
} 