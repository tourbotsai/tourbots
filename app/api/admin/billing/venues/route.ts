import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();

    const [{ data: plans, error: plansError }, { data: addons, error: addonsError }] = await Promise.all([
      supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('billing_addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (plansError) throw plansError;
    if (addonsError) throw addonsError;

    let venuesQuery = supabase
      .from('venues')
      .select('id, name, slug, email, city, subscription_plan, subscription_status')
      .order('name', { ascending: true });

    if (search) {
      venuesQuery = venuesQuery.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: venues, error: venuesError } = await venuesQuery;
    if (venuesError) throw venuesError;

    const venueIds = (venues || []).map((venue) => venue.id);

    let billingRecords: any[] = [];
    if (venueIds.length > 0) {
      const { data: records, error: recordsError } = await supabase
        .from('venue_billing_records')
        .select('*')
        .in('venue_id', venueIds);

      if (recordsError) throw recordsError;
      billingRecords = records || [];
    }

    const recordMap = new Map(billingRecords.map((record) => [record.venue_id, record]));

    const rows = (venues || []).map((venue) => ({
      venue,
      billingRecord: recordMap.get(venue.id) || null,
    }));

    return NextResponse.json({
      plans: plans || [],
      addons: addons || [],
      rows,
    });
  } catch (error: any) {
    console.error('Error fetching admin billing venues:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin billing venues' },
      { status: 500 }
    );
  }
}
