import { NextRequest, NextResponse } from 'next/server';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getUserByFirebaseUid } from '@/lib/user-service';

initAdmin();

type TeamRole = 'owner' | 'admin' | 'manager' | 'viewer';
const MANAGE_ROLES = new Set<TeamRole>(['owner', 'admin']);

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
    console.error('Team member password auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

async function canManageTeam(context: AuthContext): Promise<boolean> {
  if (context.role === 'platform_admin') {
    return true;
  }

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', context.venueId)
    .single();

  if (venueError) {
    throw new Error(venueError.message);
  }

  if (venue?.owner_id === context.userId) {
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
      return NextResponse.json({ error: 'Only owner or admins can set team member passwords' }, { status: 403 });
    }

    const targetUserId = params.userId;
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    if (password.length > 100) {
      return NextResponse.json(
        { error: 'Password must be 100 characters or fewer' },
        { status: 400 }
      );
    }

    const { data: memberAccess, error: accessError } = await supabase
      .from('user_venue_access')
      .select('user_id')
      .eq('user_id', targetUserId)
      .eq('venue_id', context.venueId)
      .maybeSingle();

    if (accessError) {
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }
    if (!memberAccess) {
      return NextResponse.json({ error: 'Team member not found in this venue' }, { status: 404 });
    }

    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: userError?.message || 'User not found' }, { status: 404 });
    }

    await auth.updateUser(targetUser.firebase_uid, { password });

    return NextResponse.json({
      success: true,
      message: `Password updated for ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error('Team member password PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
