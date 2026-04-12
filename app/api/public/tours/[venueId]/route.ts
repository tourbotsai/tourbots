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

    const tour = tours.find((candidate) => candidate.tour_type === 'primary') || tours[0];

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