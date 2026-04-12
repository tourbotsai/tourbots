import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  extractBearerToken,
  resolveCachedUserFromBearerToken,
} from '@/lib/server-auth-context';

export interface ChatbotRouteAuthContext {
  userId: string;
  firebaseUid: string;
  role: string;
  venueId: string;
}

export async function authenticateChatbotRoute(
  request: NextRequest
): Promise<ChatbotRouteAuthContext | NextResponse> {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const user = await resolveCachedUserFromBearerToken(token);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.venue_id) {
      return NextResponse.json({ error: 'User not associated with a venue' }, { status: 403 });
    }

    return {
      userId: user.id,
      firebaseUid: user.firebase_uid,
      role: user.role,
      venueId: user.venue_id,
    };
  } catch (error) {
    console.error('Chatbot route authentication error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export function ensureVenueScope(
  authContext: ChatbotRouteAuthContext,
  requestedVenueId?: string | null
): NextResponse | null {
  if (!requestedVenueId) return null;

  const isPlatformAdmin = authContext.role === 'platform_admin';
  if (requestedVenueId !== authContext.venueId && !isPlatformAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: venue access denied' },
      { status: 403 }
    );
  }

  return null;
}

export function getScopedVenueId(
  authContext: ChatbotRouteAuthContext,
  requestedVenueId?: string | null
): string {
  if (requestedVenueId && authContext.role === 'platform_admin') {
    return requestedVenueId;
  }

  return authContext.venueId;
}

export async function ensureTourScope(
  venueId: string,
  tourId?: string | null
): Promise<NextResponse | null> {
  if (!tourId) {
    return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
  }

  const { data: tour, error } = await supabase
    .from('tours')
    .select('id')
    .eq('id', tourId)
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error || !tour) {
    return NextResponse.json({ error: 'Tour not found for venue' }, { status: 404 });
  }

  return null;
}

export async function getScopedChatbotConfig(
  configId: string,
  venueId: string
): Promise<{ id: string; venue_id: string; tour_id?: string | null; openai_vector_store_id?: string | null } | null> {
  const { data } = await supabase
    .from('chatbot_configs')
    .select('id, venue_id, tour_id, openai_vector_store_id')
    .eq('id', configId)
    .eq('venue_id', venueId)
    .maybeSingle();

  return data || null;
}

export function logChatbotAudit(
  action: string,
  authContext: ChatbotRouteAuthContext,
  metadata: Record<string, unknown> = {}
) {
  console.info('[chatbot-audit]', {
    action,
    user_id: authContext.userId,
    venue_id: authContext.venueId,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

