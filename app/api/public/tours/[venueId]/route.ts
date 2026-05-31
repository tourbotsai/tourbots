import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { trackEmbedView } from '@/lib/embed-analytics';

export async function GET(
  request: NextRequest, 
  { params }: { params: { venueId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const embedId = searchParams.get('id');
    const domain = searchParams.get('domain');
    const pageUrl = searchParams.get('pageUrl');
    // Optional: load a specific tour (e.g. an agency-portal client's shared tour)
    // rather than defaulting to the venue's primary tour. Scoped to this venue below.
    const requestedTourId = searchParams.get('tourId');

    // Fetch active tours deterministically to avoid .single() failures on multi-tour venues.
    const { data: tours, error } = await supabase
      .from('tours')
      .select(`
        *,
        venues (
          id,
          name,
          city,
          country
        )
      `)
      .eq('venue_id', params.venueId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch tours' },
        { status: 500 }
      );
    }

    if (!tours || tours.length === 0) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // If a specific tour was requested and it belongs to this venue (and is active),
    // return it. Otherwise fall back to the venue's primary tour as before.
    const tour =
      (requestedTourId
        ? tours.find((candidate) => candidate.id === requestedTourId)
        : null) ||
      tours.find((candidate) => candidate.tour_type === 'primary') ||
      tours[0];

    // Track view if embedId provided
    if (embedId) {
      await trackEmbedView(embedId, params.venueId, 'tour', domain || undefined, pageUrl || undefined);
    }

    return NextResponse.json({
      tour,
      venue: tour.venues,
    });
  } catch (error) {
    console.error('Error fetching public tour:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}