import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/venues - List all venues
export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { data: venueRows, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const venuesWithCounts = await Promise.all(
      (venueRows || []).map(async (venue) => {
        const { count } = await supabase
          .from('user_venue_access')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id);

        return {
          ...venue,
          user_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      venues: venuesWithCounts,
    });
  } catch (error: any) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

