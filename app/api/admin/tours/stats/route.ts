import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const venueIds = Array.isArray(body?.venueIds) ? body.venueIds : [];

    let query = supabase
      .from('embed_stats')
      .select('views_count, last_viewed_at, venue_id')
      .eq('embed_type', 'tour');

    if (venueIds.length > 0) {
      query = query.in('venue_id', venueIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalViews = (data || []).reduce((sum: number, row: any) => sum + (row.views_count || 0), 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentViews = (data || [])
      .filter((row: any) => row.last_viewed_at && new Date(row.last_viewed_at) >= sevenDaysAgo)
      .reduce((sum: number, row: any) => sum + (row.views_count || 0), 0);

    return NextResponse.json({ totalViews, recentViews });
  } catch (error: any) {
    console.error('Error fetching filtered admin tour stats:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch filtered stats' }, { status: 500 });
  }
}
