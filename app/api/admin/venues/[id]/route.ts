import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getPlatformAdminUserId } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/venues/[id] - Get single venue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { data: venue, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      venue,
    });
  } catch (error: any) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/venues/[id] - Update venue
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;
    const platformAdminUserId = getPlatformAdminUserId();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or empty JSON body' },
        { status: 400 }
      );
    }
    const { name, email, phone, address, city, postcode, in_setup } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postcode !== undefined) updateData.postcode = postcode;
    if (in_setup !== undefined) updateData.in_setup = in_setup;
    
    updateData.updated_at = new Date().toISOString();

    const { data: venue, error } = await supabase
      .from('venues')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Log admin action
    await supabase.from('admin_subscription_actions').insert({
      venue_id: params.id,
      admin_user_id: platformAdminUserId,
      action_type: 'setup_mode_enabled',
      action_details: updateData,
      notes: 'Venue updated via admin panel',
    });

    return NextResponse.json({
      success: true,
      venue,
      message: 'Venue updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update venue' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/venues/[id] - Delete venue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    // Note: This will cascade delete related records due to database constraints
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting venue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete venue' },
      { status: 500 }
    );
  }
}

