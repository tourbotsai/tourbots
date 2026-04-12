import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { getUserByFirebaseUid } from '@/lib/user-service';
import type { User } from '@/lib/types';
import { updateUser } from '@/lib/user-service';

initAdmin();

type AuthContext = {
  requester: User;
  isPlatformAdmin: boolean;
};

const SELF_EDITABLE_FIELDS = new Set([
  'first_name',
  'last_name',
  'profile_image_url',
  'phone',
]);

const PLATFORM_ADMIN_EDITABLE_FIELDS = new Set([
  'first_name',
  'last_name',
  'profile_image_url',
  'phone',
  'is_active',
]);

const SENSITIVE_USER_FIELDS = new Set([
  'role',
  'firebase_uid',
  'venue_id',
  'email',
  'id',
  'created_at',
  'updated_at',
]);

async function getAuthorisedContext(
  request: NextRequest,
  targetUserId: string
): Promise<{ context?: AuthContext; error?: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Authorisation header required' }, { status: 401 }),
    };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await auth.verifyIdToken(token);
    const requester = await getUserByFirebaseUid(decoded.uid);

    if (!requester) {
      return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
    }

    const isPlatformAdmin = requester.role === 'platform_admin';
    const isSelf = requester.id === targetUserId;

    if (!isPlatformAdmin && !isSelf) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return {
      context: {
        requester,
        isPlatformAdmin,
      },
    };
  } catch (error) {
    console.error('User route auth error:', error);
    return {
      error: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }),
    };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const { error: authError } = await getAuthorisedContext(req, userId);
    if (authError) return authError;
    
    // Fetch user with venue data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        venue:venue_id (*)
      `)
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(userData);
  } catch (err) {
    console.error('Unexpected error fetching user details:', err);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { context, error: authError } = await getAuthorisedContext(req, userId);
    if (authError) return authError;

    const body = (await req.json()) as Record<string, unknown>;
    
    // Validate data
    if (!body) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const allowedFields = context?.isPlatformAdmin
      ? PLATFORM_ADMIN_EDITABLE_FIELDS
      : SELF_EDITABLE_FIELDS;
    const rejectedSensitiveFields = Object.keys(body).filter((key) => SENSITIVE_USER_FIELDS.has(key));
    if (rejectedSensitiveFields.length > 0) {
      return NextResponse.json(
        {
          error: `Sensitive fields are not editable in this endpoint: ${rejectedSensitiveFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updatePayload = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.has(key))
    );

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No permitted fields provided for update' },
        { status: 400 }
      );
    }
    
    // Update user
    const updatedUser = await updateUser(userId, updatePayload);
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Unexpected error updating user:', err);
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
} 