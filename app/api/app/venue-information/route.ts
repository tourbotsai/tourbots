import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue, AuthenticatedVenueContext } from '@/lib/authenticated-venue';

function getScopedVenueId(
  authContext: AuthenticatedVenueContext,
  requestedVenueId?: string | null
): string | NextResponse {
  if (!requestedVenueId) return authContext.venueId;

  const isPlatformAdmin = authContext.role === 'platform_admin';
  if (requestedVenueId !== authContext.venueId && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
  }

  return requestedVenueId;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const scopedVenueId = getScopedVenueId(authResult, searchParams.get('venueId'));
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;

    const { data, error } = await supabase
      .from('venue_information')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .eq('venue_id', scopedVenueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(null);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching venue information:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch venue information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, information } = await request.json();
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', scopedVenueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const informationData = {
      venue_id: scopedVenueId,
      ...information,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('venue_information')
      .insert([informationData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating venue information:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create venue information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, information } = await request.json();
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;

    const { data, error } = await supabase
      .from('venue_information')
      .upsert({
        venue_id: scopedVenueId,
        ...information,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'venue_id'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating venue information:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update venue information' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = await request.json();
    const scopedVenueId = getScopedVenueId(authResult, venueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;

    const { data, error } = await supabase
      .from('venue_information')
      .delete()
      .eq('venue_id', scopedVenueId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedInformation: data });
  } catch (error: any) {
    console.error('Error deleting venue information:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete venue information' },
      { status: 500 }
    );
  }
}
