import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

// GET - Fetch all tour points for a venue's tours
export async function GET(
  request: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = await params;
    const isPlatformAdmin = authResult.role === 'platform_admin';
    if (venueId !== authResult.venueId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }

    // First, get all tour IDs for this venue
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id')
      .eq('venue_id', venueId);

    if (toursError) throw toursError;

    // If no tours, return empty array
    if (!tours || tours.length === 0) {
      return NextResponse.json([]);
    }

    const tourIds = tours.map(t => t.id);

    // Fetch all tour points for this venue's tours
    const { data: points, error } = await supabase
      .from('tour_points')
      .select(`
        *,
        tour:tour_id (
          id,
          title,
          venue_id
        )
      `)
      .in('tour_id', tourIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(points || []);

  } catch (error: any) {
    console.error('Error fetching tour points:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

