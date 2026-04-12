import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { updateVenue } from '@/lib/user-service';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { getUserByFirebaseUid } from '@/lib/user-service';

initAdmin();

type TeamRole = 'owner' | 'admin' | 'manager' | 'viewer';
const WRITE_ROLES = new Set<TeamRole>(['owner', 'admin']);

interface AuthContext {
  userId: string;
  venueId: string;
  role: string;
}

const ALLOWED_VENUE_PATCH_FIELDS = new Set([
  'name',
  'description',
  'email',
  'phone',
  'website_url',
  'address',
  'city',
  'postcode',
  'country',
  'subscription_plan',
  'theme_preference',
  'hide_onboarding_checklist',
  'pressed_share',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitiseVenuePatchPayload(
  payload: unknown
): { updates: Record<string, unknown>; droppedFields: string[] } {
  if (!isPlainObject(payload)) {
    throw new Error('Invalid JSON payload. Expected an object.');
  }

  const updates: Record<string, unknown> = {};
  const droppedFields: string[] = [];

  for (const [rawKey, value] of Object.entries(payload)) {
    const key = rawKey.trim();
    if (!ALLOWED_VENUE_PATCH_FIELDS.has(key)) {
      droppedFields.push(key);
      continue;
    }

    switch (key) {
      case 'subscription_plan': {
        if (!['essential', 'professional', 'premium'].includes(String(value))) {
          throw new Error('Invalid subscription_plan value.');
        }
        updates[key] = value;
        break;
      }
      case 'theme_preference': {
        if (!['light', 'dark'].includes(String(value))) {
          throw new Error('Invalid theme_preference value.');
        }
        updates[key] = value;
        break;
      }
      case 'hide_onboarding_checklist':
      case 'pressed_share': {
        if (typeof value !== 'boolean') {
          throw new Error(`${key} must be a boolean.`);
        }
        updates[key] = value;
        break;
      }
      case 'description':
      case 'phone':
      case 'website_url':
      case 'email': {
        if (value !== null && typeof value !== 'string') {
          throw new Error(`${key} must be a string or null.`);
        }
        updates[key] = value;
        break;
      }
      default: {
        if (typeof value !== 'string') {
          throw new Error(`${key} must be a string.`);
        }
        updates[key] = value;
      }
    }
  }

  return { updates, droppedFields };
}

async function getAuthContext(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await auth.verifyIdToken(token);
    const user = await getUserByFirebaseUid(decoded.uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.venue_id) {
      return NextResponse.json({ error: 'User not linked to venue' }, { status: 403 });
    }
    return {
      userId: user.id,
      venueId: user.venue_id,
      role: user.role,
    };
  } catch (error) {
    console.error('Venue route auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

async function hasVenueReadAccess(context: AuthContext, requestedVenueId: string): Promise<boolean> {
  if (context.role === 'platform_admin') return true;
  if (context.venueId === requestedVenueId) return true;

  const { data: access, error } = await supabase
    .from('user_venue_access')
    .select('id')
    .eq('user_id', context.userId)
    .eq('venue_id', requestedVenueId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(access);
}

async function hasVenueWriteAccess(context: AuthContext, requestedVenueId: string): Promise<boolean> {
  if (context.role === 'platform_admin') return true;
  if (context.venueId === requestedVenueId) {
    const { data: ownerVenue } = await supabase
      .from('venues')
      .select('owner_id')
      .eq('id', requestedVenueId)
      .maybeSingle();
    if (ownerVenue?.owner_id === context.userId) return true;
  }

  const { data: access, error } = await supabase
    .from('user_venue_access')
    .select('role')
    .eq('user_id', context.userId)
    .eq('venue_id', requestedVenueId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(access?.role && WRITE_ROLES.has(access.role as TeamRole));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const venueId = params.venueId;
    const context = await getAuthContext(req);
    if (context instanceof NextResponse) return context;

    if (!(await hasVenueReadAccess(context, venueId))) {
      return NextResponse.json({ error: 'Forbidden: venue access denied' }, { status: 403 });
    }
    
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select(`
        *,
        owner:owner_id (*)
      `)
      .eq('id', venueId)
      .single();
    
    if (venueError) {
      console.error('Error fetching venue:', venueError);
      return NextResponse.json({ error: venueError.message }, { status: 500 });
    }
    
    if (!venueData) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    return NextResponse.json(venueData);
  } catch (err) {
    console.error('Unexpected error fetching venue details:', err);
    return NextResponse.json({ error: 'Failed to fetch venue details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const venueId = params.venueId;
    const context = await getAuthContext(req);
    if (context instanceof NextResponse) return context;

    if (!(await hasVenueWriteAccess(context, venueId))) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 });
    }

    const { updates, droppedFields } = sanitiseVenuePatchPayload(body);
    const updateKeys = Object.keys(updates);

    if (updateKeys.length === 0) {
      return NextResponse.json(
        { error: 'No valid venue fields provided for update.' },
        { status: 400 }
      );
    }

    if (droppedFields.length > 0) {
      console.warn('Dropped disallowed venue patch fields:', droppedFields);
    }

    const updatedVenue = await updateVenue(venueId, updates);
    
    if (!updatedVenue) {
      return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, venue: updatedVenue });
  } catch (err: any) {
    console.error('Unexpected error updating venue:', err);
    const message = err?.message || 'Failed to update venue';
    const isValidationError =
      typeof message === 'string' &&
      (message.startsWith('Invalid ') || message.includes('must be'));

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
