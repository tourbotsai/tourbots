import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

// GET - Fetch all tours for a venue
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

    // Fetch all tours for this venue
    const { data: tours, error } = await supabase
      .from('tours')
      .select('id, title, description, matterport_tour_id, tour_type, display_order, is_active')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(tours || []);

  } catch (error: any) {
    console.error('Error fetching tours:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

