import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export async function GET(
  req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const venueId = params.venueId;
    const { searchParams } = new URL(req.url);
    const requestedTourId = searchParams.get('tourId');

    if (requestedTourId) {
      const { data: requestedTour, error: requestedTourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', requestedTourId)
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .maybeSingle();

      if (requestedTourError) {
        console.error('Error fetching requested tour:', requestedTourError);
        return NextResponse.json({ error: requestedTourError.message }, { status: 500 });
      }

      if (requestedTour) {
        return NextResponse.json(requestedTour);
      }
    }

    const { data: tours, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (tourError) {
      console.error('Error fetching tour:', tourError);
      return NextResponse.json({ error: tourError.message }, { status: 500 });
    }

    if (!tours || tours.length === 0) {
      return NextResponse.json({ error: 'No active tour found' }, { status: 404 });
    }

    const primaryTour = tours.find((tour) => tour.tour_type === 'primary') || tours[0];
    return NextResponse.json(primaryTour);
  } catch (err) {
    console.error('Unexpected error fetching tour:', err);
    return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
  }
}
