import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    let query = supabase
      .from('chatbot_configs')
      .select(`
        *,
        venues (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching chatbot configs:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot configs' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { configId, updates } = await request.json();

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chatbot_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating chatbot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { venueId, config } = await request.json();

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chatbot_configs')
      .insert([{ venue_id: venueId, ...config }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating chatbot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot config' },
      { status: 500 }
    );
  }
} 