import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const {
      venueId: requestedVenueId,
      title,
      description = null,
      matterport_tour_id,
      matterport_url,
      thumbnail_url = null,
    } = await request.json();

    const venueId = requestedVenueId || authResult.venueId;
    const isPlatformAdmin = authResult.role === 'platform_admin';
    if (venueId !== authResult.venueId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    if (!title || !matterport_tour_id || !matterport_url) {
      return NextResponse.json(
        { error: 'title, matterport_tour_id, and matterport_url are required' },
        { status: 400 }
      );
    }

    const { data: existingPrimary, error: existingError } = await supabase
      .from('tours')
      .select('id')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .or('tour_type.eq.primary,tour_type.is.null')
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingPrimary?.id) {
      const { data, error } = await supabase
        .from('tours')
        .update({
          title,
          description,
          matterport_tour_id,
          matterport_url,
          thumbnail_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrimary.id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('tours')
      .insert([
        {
          venue_id: venueId,
          parent_tour_id: null,
          title,
          description,
          matterport_tour_id,
          matterport_url,
          thumbnail_url,
          tour_type: 'primary',
          is_active: true,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error upserting primary tour:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upsert primary tour' },
      { status: 500 }
    );
  }
}
