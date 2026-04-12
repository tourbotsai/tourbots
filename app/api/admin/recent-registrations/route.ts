import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    // Get recent registrations with subscription status
    const { data: registrations, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        venue_id,
        venues!inner (
          id,
          name
        )
      `)
      .eq('role', 'admin') // Only venue owners/admins, not platform admins
      .not('venue_id', 'is', null) // Must have a venue
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // For each registration, check subscription status
    const registrationsWithStatus = await Promise.all(
      registrations.map(async (reg: any) => {
        // Check for active subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('venue_id', reg.venue_id)
          .single();

        // Check for pending payment links
        const { data: pendingLinks } = await supabase
          .from('payment_links')
          .select('id')
          .eq('venue_id', reg.venue_id)
          .eq('status', 'pending');

        return {
          id: reg.venue_id, // Use venue_id as the main identifier
          email: reg.email,
          first_name: reg.first_name,
          last_name: reg.last_name,
          venue_name: reg.venues.name,
          created_at: reg.created_at,
          subscription_status: subscription?.status || 'pending',
          pending_payment_links: pendingLinks?.length || 0,
          has_active_subscription: subscription?.status === 'active',
        };
      })
    );

    return NextResponse.json({
      success: true,
      registrations: registrationsWithStatus,
    });
  } catch (error: any) {
    console.error('Error fetching recent registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent registrations' },
      { status: 500 }
    );
  }
} 