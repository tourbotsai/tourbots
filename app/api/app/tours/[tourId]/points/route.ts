import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

async function resolveTourAccess(
  request: NextRequest,
  tourId: string,
  options?: { requireCsrf?: boolean }
): Promise<{ venueId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const hasBearer = Boolean(authHeader && authHeader.startsWith('Bearer '));

  if (hasBearer) {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;
    return { venueId: authResult.venueId };
  }

  const portalSession = await requireAgencyPortalSession(request, {
    requiredModule: 'tour',
    requireCsrf: options?.requireCsrf,
  });
  if (portalSession instanceof NextResponse) return portalSession;
  if (portalSession.tourId !== tourId) {
    return NextResponse.json({ error: 'Tour not available for this share' }, { status: 403 });
  }

  return { venueId: portalSession.venueId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    
    // Authenticate app user or agency portal session
    const authResult = await resolveTourAccess(request, tourId);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { venueId } = authResult;

    // Verify user owns the tour's venue
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('venue_id')
      .eq('id', tourId)
      .eq('venue_id', venueId)
      .single();

    if (tourError || !tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const { data: tourPoints, error } = await supabase
      .from('tour_points')
      .select('id, name, sweep_id, position, rotation, created_at, updated_at')
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ points: tourPoints || [] });
  } catch (error: any) {
    console.error('Error fetching tour points:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tour points' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    const { name, sweep_id, position, rotation } = await request.json();
    
    // Authenticate app user or agency portal session
    const authResult = await resolveTourAccess(request, tourId, { requireCsrf: true });
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { venueId } = authResult;

    // Verify user owns the tour's venue
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('venue_id')
      .eq('id', tourId)
      .eq('venue_id', venueId)
      .single();

    if (tourError || !tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Insert new point
    const { data, error } = await supabase
      .from('tour_points')
      .insert({
        tour_id: tourId,
        name,
        sweep_id,
        position,
        rotation,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Tour point saved successfully', point: data });
  } catch (error: any) {
    console.error('Error saving tour point:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save tour point' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    const { searchParams } = new URL(request.url);
    const pointId = searchParams.get('pointId');

    if (!pointId) {
      return NextResponse.json({ error: 'Point ID required' }, { status: 400 });
    }
    
    // Authenticate app user or agency portal session
    const authResult = await resolveTourAccess(request, tourId, { requireCsrf: true });
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { venueId } = authResult;

    // Verify user owns the tour's venue
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('venue_id')
      .eq('id', tourId)
      .eq('venue_id', venueId)
      .single();

    if (tourError || !tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Delete the point
    const { error } = await supabase
      .from('tour_points')
      .delete()
      .eq('id', pointId)
      .eq('tour_id', tourId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Tour point deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting tour point:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tour point' },
      { status: 500 }
    );
  }
}
