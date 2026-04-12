import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const [{ data: venues, error: venuesError }, { data: embedStats, error: embedError }] = await Promise.all([
      supabase
        .from('venues')
        .select('*, tours(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('embed_stats')
        .select('views_count, last_viewed_at')
        .eq('embed_type', 'tour'),
    ]);

    if (venuesError) throw venuesError;
    if (embedError) throw embedError;

    const transformedVenues = (venues || []).map((venue: any) => {
      const activeTour = venue.tours?.find((tour: any) => tour.is_active);
      return {
        ...venue,
        tour: activeTour || null,
        tourStatus: activeTour ? 'active' : 'pending',
        lastTourUpdate: activeTour?.updated_at || null,
      };
    });

    const totalVenues = transformedVenues.length;
    const activeTours = transformedVenues.filter((v: any) => v.tourStatus === 'active').length;
    const totalViews = (embedStats || []).reduce((sum: number, stat: any) => sum + (stat.views_count || 0), 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentViews = (embedStats || [])
      .filter((stat: any) => stat.last_viewed_at && new Date(stat.last_viewed_at) >= sevenDaysAgo)
      .reduce((sum: number, stat: any) => sum + (stat.views_count || 0), 0);

    return NextResponse.json({
      venues: transformedVenues,
      stats: {
        totalVenues,
        activeTours,
        pendingTours: totalVenues - activeTours,
        totalViews,
        recentViews,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin tours:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch admin tours' }, { status: 500 });
  }
}
