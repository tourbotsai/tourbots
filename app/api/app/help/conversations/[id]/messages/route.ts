import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { Resend } from 'resend';
import { z } from 'zod';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();
const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_INBOX_EMAIL = process.env.SUPPORT_NOTIFICATION_EMAIL || 'tourbotsai@gmail.com';
const SUPPORT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message is required.'),
});

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
    console.error('Support messages auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function GET(
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

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error: any) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch support messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateAppUser(request);
    if (authResult instanceof NextResponse) return authResult;
    const { appUserId } = authResult;

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .select('id, requester_email, help_topic')
      .eq('id', params.id)
      .eq('created_by_user_id', appUserId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: params.id,
        sender_type: 'user',
        sender_user_id: appUserId,
        message: parsed.data.message,
      })
      .select('*')
      .single();

    if (messageError || !newMessage) {
      throw messageError || new Error('Failed to create message');
    }

    const { error: updateConversationError } = await supabase
      .from('support_conversations')
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateConversationError) {
      throw updateConversationError;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `TourBots Support <${SUPPORT_FROM_EMAIL}>`,
        to: [SUPPORT_INBOX_EMAIL],
        replyTo: conversation.requester_email,
        subject: `Support reply from user: ${conversation.help_topic}`,
        text: [
          `Conversation ID: ${params.id}`,
          '',
          parsed.data.message,
        ].join('\n'),
      });

      if (error) {
        console.error('Resend support user reply error:', error);
      } else {
        console.info('Resend support user reply sent:', data?.id ?? 'no-message-id');
      }
    } catch (emailError) {
      console.error('Failed to send support reply email:', emailError);
    }

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating support message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create support message' },
      { status: 500 }
    );
  }
}
