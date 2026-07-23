import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateChatbotRoute } from '@/lib/chatbot-route-auth';
import { LeadStatus } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const status = body?.status as LeadStatus | undefined;
    if (status !== 'new' && status !== 'contacted' && status !== 'archived') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    let query = supabase.from('leads').select('id, venue_id').eq('id', id);
    if (authResult.role !== 'platform_admin') {
      query = query.eq('venue_id', authResult.venueId);
    }
    const { data: existing, error: existingError } = await query.maybeSingle();
    if (existingError || !existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update lead');
    }

    return NextResponse.json({ lead: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
