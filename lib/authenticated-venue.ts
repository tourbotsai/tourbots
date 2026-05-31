import { NextRequest, NextResponse } from 'next/server';
import {
  extractBearerToken,
  resolveCachedUserWithVenueFromBearerToken,
} from '@/lib/server-auth-context';

export interface AuthenticatedVenueContext {
  userId: string;
  venueId: string;
  userEmail: string;
  role: string;
}

/**
 * Resolve the venue a request should operate on. Platform admins may target any
 * venue by passing a `venueId`; everyone else is locked to their own venue (and
 * a mismatched request is rejected). Returns a NextResponse on denial.
 */
export function getScopedVenueId(
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

export async function authenticateAndGetVenue(
  request: NextRequest
): Promise<AuthenticatedVenueContext | NextResponse> {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const userWithVenue = await resolveCachedUserWithVenueFromBearerToken(token);

    if (!userWithVenue) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userWithVenue.venue_id) {
      return NextResponse.json({ error: 'User not associated with a venue' }, { status: 403 });
    }

    return {
      userId: userWithVenue.id,
      venueId: userWithVenue.venue_id,
      userEmail: userWithVenue.email,
      role: userWithVenue.role,
    };
  } catch (error) {
    console.error('Authenticated venue error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

