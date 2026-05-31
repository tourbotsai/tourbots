import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getVenueBillingOverview } from '@/lib/server/venue-billing-overview';
import {
  getVenueSubscription,
  getVenueSubscriptionDetails,
  getVenueInvoices,
} from '@/lib/stripe-customer';

export const dynamic = 'force-dynamic';

/**
 * Admin billing view for a specific venue. Reuses the same Stripe-aligned
 * billing overview and subscription data the user-facing billing page uses, so
 * platform admins see full parity (live add-on rows, invoices, cancel/renewal
 * dates) for any account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const venueId = params.id;

    const [overview, status, details, invoices] = await Promise.all([
      getVenueBillingOverview(venueId),
      getVenueSubscription(venueId).catch(() => null),
      getVenueSubscriptionDetails(venueId).catch(() => null),
      getVenueInvoices(venueId).catch(() => []),
    ]);

    return NextResponse.json({
      ...overview,
      subscriptionStatus: status,
      subscriptionDetails: details,
      invoices,
    });
  } catch (error: any) {
    console.error('Error fetching admin venue billing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}
