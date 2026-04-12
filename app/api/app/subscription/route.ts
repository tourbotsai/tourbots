import { NextRequest, NextResponse } from 'next/server';
import {
  getVenueSubscription,
  getVenueSubscriptionDetails,
  getVenueInvoices,
  getVenuePendingPaymentLinks
} from '@/lib/stripe-customer';
import { authenticateAndGetVenue, AuthenticatedVenueContext } from '@/lib/authenticated-venue';

export const dynamic = 'force-dynamic';

function getScopedVenueId(
  authContext: AuthenticatedVenueContext,
  requestedVenueId?: string | null
): string | NextResponse {
  if (!requestedVenueId) return authContext.venueId;

  const isPlatformAdmin = authContext.role === 'platform_admin';
  if (requestedVenueId !== authContext.venueId && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
  }

  return requestedVenueId;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const type = searchParams.get('type');
    const scopedVenueId = getScopedVenueId(authResult, requestedVenueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;

    if (type === 'status') {
      const status = await getVenueSubscription(scopedVenueId);
      return NextResponse.json({ status });
    } else if (type === 'details') {
      const details = await getVenueSubscriptionDetails(scopedVenueId);
      return NextResponse.json({ details });
    } else if (type === 'invoices') {
      const invoices = await getVenueInvoices(scopedVenueId);
      return NextResponse.json({ invoices });
    } else if (type === 'pending-links') {
      const pendingLinks = await getVenuePendingPaymentLinks(scopedVenueId);
      return NextResponse.json({ pendingLinks });
    } else {
      // Return all subscription data by default
      const [status, details, invoices, pendingLinks] = await Promise.all([
        getVenueSubscription(scopedVenueId),
        getVenueSubscriptionDetails(scopedVenueId),
        getVenueInvoices(scopedVenueId),
        getVenuePendingPaymentLinks(scopedVenueId)
      ]);
      
      return NextResponse.json({ 
        status, 
        details, 
        invoices, 
        pendingLinks 
      });
    }
  } catch (error: any) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}
