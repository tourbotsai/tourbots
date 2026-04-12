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

type AccountRole = 'user' | 'admin' | 'platform_admin';

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

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    if (context instanceof NextResponse) return context;

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('owner_id')
      .eq('id', context.venueId)
      .single();

    if (venueError) {
      return NextResponse.json({ error: venueError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('user_venue_access')
      .select(`
        user_id,
        role,
        created_at,
        users!fk_user_venue_access_user (
          id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          venue_id,
          created_at
        )
      `)
      .eq('venue_id', context.venueId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (data || [])
      .map((row: any) => {
        const user = row.users;
        if (!user) return null;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return {
          user_id: row.user_id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          full_name: fullName || user.email,
          access_role: row.role,
          account_role: user.role,
          is_primary: user.venue_id === context.venueId,
          is_owner: venue.owner_id === row.user_id,
          is_active: user.is_active,
          access_granted_at: row.created_at,
          created_at: user.created_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      venueId: context.venueId,
      members,
    });
  } catch (error: any) {
    console.error('Team members GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    if (context instanceof NextResponse) return context;

    const allowed = await canManageTeam(context);
    if (!allowed) {
      return NextResponse.json({ error: 'Only owner or admins can manage team members' }, { status: 403 });
    }

    const body = await request.json();
    const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const firstName = typeof body?.first_name === 'string' ? body.first_name.trim() : '';
    const lastName = typeof body?.last_name === 'string' ? body.last_name.trim() : '';
    const requestedRole = typeof body?.role === 'string' ? body.role : 'viewer';
    const role = (VALID_ROLES.has(requestedRole as TeamRole) ? requestedRole : 'viewer') as TeamRole;
    const password = typeof body?.password === 'string' ? body.password : '';
    const requestedAccountRole = typeof body?.account_role === 'string' ? body.account_role : 'user';

    if (!rawEmail) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (role === 'owner') {
      return NextResponse.json({ error: 'Owner role cannot be assigned through team invites' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'password is required' }, { status: 400 });
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 100 characters' },
        { status: 400 }
      );
    }

    let accountRole: AccountRole = 'user';
    if (requestedAccountRole === 'platform_admin') {
      if (context.role !== 'platform_admin') {
        return NextResponse.json(
          { error: 'Only platform admins can assign platform_admin role' },
          { status: 403 }
        );
      }
      accountRole = 'platform_admin';
    } else if (requestedAccountRole === 'admin') {
      accountRole = 'admin';
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, email, firebase_uid, first_name, last_name, role, venue_id, is_active')
      .eq('email', rawEmail)
      .maybeSingle();

    if (existingUserError) {
      return NextResponse.json({ error: existingUserError.message }, { status: 500 });
    }

    let userId = existingUser?.id as string | undefined;
    let inviteMeta: { passwordResetLink?: string; isNewUser: boolean } = {
      isNewUser: false,
    };

    if (!existingUser) {
      const firebaseUser = await auth.createUser({
        email: rawEmail,
        password,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`.trim() || undefined,
      });

      const { data: insertedUser, error: insertUserError } = await supabase
        .from('users')
        .insert([
          {
            firebase_uid: firebaseUser.uid,
            email: rawEmail,
            first_name: firstName || null,
            last_name: lastName || null,
            role: accountRole,
            venue_id: context.venueId,
          },
        ])
        .select('id')
        .single();

      if (insertUserError || !insertedUser) {
        try {
          await auth.deleteUser(firebaseUser.uid);
        } catch (cleanupError) {
          console.error('Failed to cleanup firebase user after Supabase insert failure:', cleanupError);
        }
        return NextResponse.json({ error: insertUserError?.message || 'Failed to create team member' }, { status: 500 });
      }

      userId = insertedUser.id;
      inviteMeta.isNewUser = true;

      try {
        inviteMeta.passwordResetLink = await auth.generatePasswordResetLink(rawEmail);
      } catch (resetLinkError) {
        console.warn('Password reset link generation failed for invite:', resetLinkError);
      }
    } else {
      await auth.updateUser(existingUser.firebase_uid, { password });

      if (context.role === 'platform_admin' && accountRole === 'platform_admin' && existingUser.role !== 'platform_admin') {
        await supabase
          .from('users')
          .update({ role: 'platform_admin', updated_at: new Date().toISOString() })
          .eq('id', existingUser.id);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unable to resolve team member user ID' }, { status: 500 });
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from('user_venue_access')
      .select('id')
      .eq('user_id', userId)
      .eq('venue_id', context.venueId)
      .maybeSingle();

    if (existingAccessError) {
      return NextResponse.json({ error: existingAccessError.message }, { status: 500 });
    }
    if (existingAccess) {
      return NextResponse.json({ error: 'User already belongs to this team' }, { status: 409 });
    }

    const { error: insertAccessError } = await supabase
      .from('user_venue_access')
      .insert([
        {
          user_id: userId,
          venue_id: context.venueId,
          role,
          created_by: context.userId,
        },
      ]);

    if (insertAccessError) {
      return NextResponse.json({ error: insertAccessError.message }, { status: 500 });
    }

    await supabase
      .from('users')
      .update({ venue_id: context.venueId, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .is('venue_id', null);

    return NextResponse.json({
      success: true,
      message: 'Team member added successfully',
      invite: inviteMeta,
    });
  } catch (error: any) {
    console.error('Team members POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add team member' }, { status: 500 });
  }
}
