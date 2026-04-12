import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

const createAdminMessageSchema = z.object({
  message: z.string().min(1, 'Message is required.'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('id', params.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] });
  } catch (error: any) {
    console.error('Error fetching admin support messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = createAdminMessageSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('id', params.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: params.id,
        sender_type: 'admin',
        sender_user_id: null,
        message: parsed.data.message,
      })
      .select('*')
      .single();

    if (messageError || !newMessage) {
      throw messageError || new Error('Failed to create admin message');
    }

    const { error: updateError } = await supabase
      .from('support_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admin support message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}
