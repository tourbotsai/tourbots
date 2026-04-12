import { NextRequest, NextResponse } from 'next/server';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { getUserByFirebaseUid } from '@/lib/user-service';

initAdmin();

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Authorisation header required' }, { status: 401 }) };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await auth.verifyIdToken(token);
    const user = await getUserByFirebaseUid(decoded.uid);
    if (!user) {
      return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
    }
    return { user };
  } catch (error) {
    console.error('Profile route auth error:', error);
    return { error: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) return authResult.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or empty JSON body' },
        { status: 400 }
      );
    }
    const firstName = typeof body?.first_name === 'string' ? body.first_name.trim() : '';
    const lastName = typeof body?.last_name === 'string' ? body.last_name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'first_name, last_name and email are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.user.id)
      .select('id, first_name, last_name, email, phone, profile_image_url')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error('Profile route PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
