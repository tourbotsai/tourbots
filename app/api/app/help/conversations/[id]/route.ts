import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();

async function authenticateAppUser(request: NextRequest): Promise<{ appUserId: string } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userWithVenue = await getUserWithVenue(decodedToken.uid);

    if (!userWithVenue) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return { appUserId: userWithVenue.id };
  } catch (error) {
    console.error('Delete support conversation auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateAppUser(request);
    if (authResult instanceof NextResponse) return authResult;
    const { appUserId } = authResult;

    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('id', params.id)
      .eq('created_by_user_id', appUserId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('support_conversations')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting support conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete support conversation' },
      { status: 500 }
    );
  }
}
