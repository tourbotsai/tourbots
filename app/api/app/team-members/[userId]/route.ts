import { NextRequest, NextResponse } from 'next/server';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getUserByFirebaseUid } from '@/lib/user-service';

initAdmin();

type TeamRole = 'owner' | 'admin' | 'manager' | 'viewer';
const MANAGE_ROLES = new Set<TeamRole>(['owner', 'admin']);
const VALID_ROLES = new Set<TeamRole>(['owner', 'admin', 'manager', 'viewer']);

interface AuthContext {
  userId: string;
  venueId: string;
  role: string;
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
      return NextResponse.json({ error: 'User is not linked to a venue' }, { status: 403 });
    }

    return {
      userId: user.id,
      venueId: user.venue_id,
      role: user.role,
    };
  } catch (error) {
    console.error('Team members auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

async function getVenueOwnerId(venueId: string): Promise<string> {
  const { data, error } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .single();

  if (error || !data?.owner_id) {
    throw new Error(error?.message || 'Venue owner not found');
  }

  return data.owner_id;
}

async function canManageTeam(context: AuthContext): Promise<boolean> {
  if (context.role === 'platform_admin') {
    return true;
  }

  const ownerId = await getVenueOwnerId(context.venueId);
  if (ownerId === context.userId) {
    return true;
  }

  const { data: access, error: accessError } = await supabase
    .from('user_venue_access')
    .select('role')
    .eq('user_id', context.userId)
    .eq('venue_id', context.venueId)
    .maybeSingle();

  if (accessError) {
    throw new Error(accessError.message);
  }

  return Boolean(access?.role && MANAGE_ROLES.has(access.role as TeamRole));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const context = await getAuthContext(request);
    if (context instanceof NextResponse) return context;

    const allowed = await canManageTeam(context);
    if (!allowed) {
      return NextResponse.json({ error: 'Only owner or admins can manage team members' }, { status: 403 });
    }

    const targetUserId = params.userId;
    const body = await request.json();
    const requestedRole = typeof body?.role === 'string' ? body.role : '';
    if (!VALID_ROLES.has(requestedRole as TeamRole)) {
      return NextResponse.json({ error: 'Invalid team role' }, { status: 400 });
    }
    const nextRole = requestedRole as TeamRole;

    const ownerId = await getVenueOwnerId(context.venueId);
    if (targetUserId === ownerId) {
      return NextResponse.json({ error: 'Owner role cannot be changed from team settings' }, { status: 400 });
    }
    if (nextRole === 'owner') {
      return NextResponse.json({ error: 'Owner role assignment requires ownership transfer flow' }, { status: 400 });
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from('user_venue_access')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('venue_id', context.venueId)
      .maybeSingle();

    if (existingAccessError) {
      return NextResponse.json({ error: existingAccessError.message }, { status: 500 });
    }
    if (!existingAccess) {
      return NextResponse.json({ error: 'Team member not found in this venue' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('user_venue_access')
      .update({ role: nextRole })
      .eq('user_id', targetUserId)
      .eq('venue_id', context.venueId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Team member role updated' });
  } catch (error: any) {
    console.error('Team members PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update team member role' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const context = await getAuthContext(request);
    if (context instanceof NextResponse) return context;

    const allowed = await canManageTeam(context);
    if (!allowed) {
      return NextResponse.json({ error: 'Only owner or admins can manage team members' }, { status: 403 });
    }

    const targetUserId = params.userId;
    if (targetUserId === context.userId) {
      return NextResponse.json({ error: 'You cannot remove your own access from this screen' }, { status: 400 });
    }

    const ownerId = await getVenueOwnerId(context.venueId);
    if (targetUserId === ownerId) {
      return NextResponse.json({ error: 'Owner cannot be removed from the team' }, { status: 400 });
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from('user_venue_access')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('venue_id', context.venueId)
      .maybeSingle();

    if (existingAccessError) {
      return NextResponse.json({ error: existingAccessError.message }, { status: 500 });
    }
    if (!existingAccess) {
      return NextResponse.json({ error: 'Team member not found in this venue' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('user_venue_access')
      .delete()
      .eq('user_id', targetUserId)
      .eq('venue_id', context.venueId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { data: remainingAccess, error: remainingError } = await supabase
      .from('user_venue_access')
      .select('venue_id')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!remainingError) {
      const nextVenueId = remainingAccess && remainingAccess.length > 0 ? remainingAccess[0].venue_id : null;
      await supabase
        .from('users')
        .update({ venue_id: nextVenueId, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)
        .eq('venue_id', context.venueId);
    }

    return NextResponse.json({ success: true, message: 'Team member removed from venue' });
  } catch (error: any) {
    console.error('Team members DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove team member' }, { status: 500 });
  }
}
