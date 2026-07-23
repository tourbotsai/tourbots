import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

export interface MenuRouteAccessContext {
  venueId: string;
}

/**
 * Shared auth gate for tour menu routes: accepts either a Bearer-authenticated
 * app session (scoped to the tour's own venue, with a platform-admin bypass) or
 * an agency portal share session with the "tour" module enabled. Reused by the
 * main menu route and the blocks CRUD route so both enforce identical access.
 */
export async function resolveMenuRouteAccess(
  request: NextRequest,
  tourId: string,
  options?: { requireCsrf?: boolean }
): Promise<MenuRouteAccessContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const hasBearer = Boolean(authHeader && authHeader.startsWith('Bearer '));

  if (hasBearer) {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    // Platform admins may manage any account's tour menu, so scope to the
    // tour's own venue. Everyone else is restricted to their own venue.
    const isPlatformAdmin = authResult.role === 'platform_admin';
    let tourQuery = supabase
      .from('tours')
      .select('venue_id')
      .eq('id', tourId);
    if (!isPlatformAdmin) {
      tourQuery = tourQuery.eq('venue_id', authResult.venueId);
    }

    const { data: scopedTour, error: scopedTourError } = await tourQuery.maybeSingle();

    if (scopedTourError) {
      return NextResponse.json({ error: scopedTourError.message }, { status: 500 });
    }
    if (!scopedTour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return { venueId: scopedTour.venue_id };
  }

  const portalSession = await requireAgencyPortalSession(request, {
    requiredModule: 'tour',
    requireCsrf: options?.requireCsrf,
  });
  if (portalSession instanceof NextResponse) return portalSession;

  if (portalSession.tourId !== tourId) {
    return NextResponse.json({ error: 'Tour not available for this share' }, { status: 403 });
  }

  return { venueId: portalSession.venueId };
}
