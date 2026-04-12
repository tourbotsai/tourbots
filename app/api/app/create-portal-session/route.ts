import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/stripe-admin';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    let requestedVenueId: string | undefined;
    try {
      const body = await request.json();
      requestedVenueId = body?.venueId;
    } catch {
      requestedVenueId = undefined;
    }

    if (
      requestedVenueId &&
      authResult.role !== 'platform_admin' &&
      requestedVenueId !== authResult.venueId
    ) {
      return NextResponse.json(
        { error: 'Forbidden: venue access denied' },
        { status: 403 }
      );
    }

    const venueId =
      authResult.role === 'platform_admin' && requestedVenueId
        ? requestedVenueId
        : authResult.venueId;

    if (!venueId) {
      return NextResponse.json(
        { error: 'Unable to resolve venue scope' },
        { status: 403 }
      );
    }

    // Get the venue's subscription to find their Stripe customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('venue_id', venueId)
      .single();

    if (error || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found for this venue' },
        { status: 404 }
      );
    }

    const portalUrl = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tourbots.ai'}/app/settings`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
} 