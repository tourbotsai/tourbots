import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { tourId } = params;
    const { data: tour, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .maybeSingle();

    if (error) throw error;
    if (!tour) return NextResponse.json(null);

    const isPlatformAdmin = authResult.role === 'platform_admin';
    if (tour.venue_id !== authResult.venueId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    return NextResponse.json(tour);
  } catch (error: any) {
    console.error('Error fetching tour:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch tour' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { tourId } = params;
    const updates = await request.json();

    const { data: existing, error: existingError } = await supabase
      .from('tours')
      .select('id, venue_id')
      .eq('id', tourId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });

    const isPlatformAdmin = authResult.role === 'platform_admin';
    if (existing.venue_id !== authResult.venueId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('tours')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tourId)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating tour:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update tour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { tourId } = params;
    const { data: existing, error: existingError } = await supabase
      .from('tours')
      .select('id, venue_id')
      .eq('id', tourId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ success: true });

    const isPlatformAdmin = authResult.role === 'platform_admin';
    if (existing.venue_id !== authResult.venueId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', tourId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete tour' }, { status: 500 });
  }
}
