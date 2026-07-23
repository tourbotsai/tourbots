import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateChatbotRoute } from '@/lib/chatbot-route-auth';

async function resolveConfig(chatbotConfigId: string, venueId: string, role?: string) {
  let query = supabase
    .from('chatbot_configs')
    .select('id, venue_id, tour_id')
    .eq('id', chatbotConfigId);

  if (role !== 'platform_admin') {
    query = query.eq('venue_id', venueId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    throw new Error('Chatbot configuration not found');
  }
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatbotConfigId = searchParams.get('chatbotConfigId');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 25)));

    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('chatbot_config_id', chatbotConfigId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    return NextResponse.json({
      leads: data || [],
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
