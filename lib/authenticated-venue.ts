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

