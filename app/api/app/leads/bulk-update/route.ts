import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateLeadStatus, getLeadById } from '@/lib/leads/lead-service';
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

// POST /api/app/leads/bulk-update - Bulk update lead statuses
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenueId(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { venueId } = authResult;
    const body = await request.json();

    // Validate required fields
    if (!body.leadIds || !Array.isArray(body.leadIds)) {
      return NextResponse.json(
        { error: 'leadIds must be an array' },
        { status: 400 }
      );
    }

    if (body.leadIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one lead ID is required' },
        { status: 400 }
      );
    }

    if (body.leadIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 leads at once' },
        { status: 400 }
      );
    }

    // Validate operation type
    if (!body.operation) {
      return NextResponse.json(
        { error: 'Operation type is required' },
        { status: 400 }
      );
    }

    // Handle different bulk operations
    switch (body.operation) {
      case 'update_status':
        return await handleBulkStatusUpdate(venueId, body);
      
      case 'delete':
        return await handleBulkDelete(venueId, body);
      
      case 'assign':
        return await handleBulkAssign(venueId, body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: update_status, delete, assign' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk update' },
      { status: 500 }
    );
  }
}

// Handle bulk status update
async function handleBulkStatusUpdate(venueId: string, body: any): Promise<NextResponse> {
  try {
    const { leadIds, status } = body;

    // Validate status
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Verify all leads belong to this venue (security check)
    const verificationPromises = leadIds.map((leadId: string) => 
      getLeadById(leadId, venueId)
    );
    
    const verificationResults = await Promise.all(verificationPromises);
    const invalidLeads = verificationResults
      .map((result, index) => result ? null : leadIds[index])
      .filter(Boolean);

    if (invalidLeads.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some leads not found or do not belong to your venue',
          invalidLeadIds: invalidLeads
        },
        { status: 404 }
      );
    }

    // Perform bulk update
    const updatedLeads = await bulkUpdateLeadStatus(leadIds, venueId, status);

    return NextResponse.json({
      message: `Successfully updated ${updatedLeads.length} leads to ${status}`,
      data: {
        updatedCount: updatedLeads.length,
        updatedLeads: updatedLeads
      }
    });
  } catch (error: any) {
    console.error('Error in bulk status update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead statuses' },
      { status: 500 }
    );
  }
}

// Handle bulk delete
async function handleBulkDelete(venueId: string, body: any): Promise<NextResponse> {
  try {
    const { leadIds } = body;

    // Import delete function
    const { deleteLead } = await import('@/lib/leads/lead-service');

    // Verify all leads belong to this venue (security check)
    const verificationPromises = leadIds.map((leadId: string) => 
      getLeadById(leadId, venueId)
    );
    
    const verificationResults = await Promise.all(verificationPromises);
    const invalidLeads = verificationResults
      .map((result, index) => result ? null : leadIds[index])
      .filter(Boolean);

    if (invalidLeads.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some leads not found or do not belong to your venue',
          invalidLeadIds: invalidLeads
        },
        { status: 404 }
      );
    }

    // Perform bulk delete
    const deletePromises = leadIds.map((leadId: string) => 
      deleteLead(leadId, venueId)
    );
    
    const deleteResults = await Promise.all(deletePromises);
    const successfulDeletes = deleteResults.filter(Boolean).length;

    return NextResponse.json({
      message: `Successfully deleted ${successfulDeletes} leads`,
      data: {
        deletedCount: successfulDeletes,
        totalRequested: leadIds.length
      }
    });
  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

// Handle bulk assign
async function handleBulkAssign(venueId: string, body: any): Promise<NextResponse> {
  try {
    const { leadIds, assignedTo } = body;

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'assignedTo user ID is required' },
        { status: 400 }
      );
    }

    // Import update function
    const { updateLead } = await import('@/lib/leads/lead-service');

    // Verify all leads belong to this venue (security check)
    const verificationPromises = leadIds.map((leadId: string) => 
      getLeadById(leadId, venueId)
    );
    
    const verificationResults = await Promise.all(verificationPromises);
    const invalidLeads = verificationResults
      .map((result, index) => result ? null : leadIds[index])
      .filter(Boolean);

    if (invalidLeads.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some leads not found or do not belong to your venue',
          invalidLeadIds: invalidLeads
        },
        { status: 404 }
      );
    }

    // Perform bulk assignment
    const updatePromises = leadIds.map((leadId: string) => 
      updateLead(leadId, venueId, { assigned_to: assignedTo })
    );
    
    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(Boolean);

    return NextResponse.json({
      message: `Successfully assigned ${successfulUpdates.length} leads`,
      data: {
        assignedCount: successfulUpdates.length,
        totalRequested: leadIds.length,
        assignedTo: assignedTo
      }
    });
  } catch (error: any) {
    console.error('Error in bulk assign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign leads' },
      { status: 500 }
    );
  }
} 