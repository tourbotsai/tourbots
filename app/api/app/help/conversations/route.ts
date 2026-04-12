import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { Resend } from 'resend';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();
const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_INBOX_EMAIL = process.env.SUPPORT_NOTIFICATION_EMAIL || 'tourbotsai@gmail.com';
const SUPPORT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const createConversationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  venueName: z.string().optional(),
  helpTopic: z.string().min(1, 'Help topic is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

async function authenticateAppUser(request: NextRequest): Promise<
  { appUserId: string; venueId: string; firebaseUid: string; email: string } | NextResponse
> {
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

    if (!userWithVenue.venue_id) {
      return NextResponse.json({ error: 'User is not linked to a venue' }, { status: 403 });
    }

    return {
      appUserId: userWithVenue.id,
      venueId: userWithVenue.venue_id,
      firebaseUid: decodedToken.uid,
      email: userWithVenue.email,
    };
  } catch (error) {
    console.error('Support conversations auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAppUser(request);
    if (authResult instanceof NextResponse) return authResult;

    const { appUserId } = authResult;

    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('created_by_user_id', appUserId)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error: any) {
    console.error('Error fetching support conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch support conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAppUser(request);
    if (authResult instanceof NextResponse) return authResult;

    const { appUserId, venueId } = authResult;
    const body = await request.json();
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { name, email, phone, venueName, helpTopic, message } = parsed.data;
    const subject = `${helpTopic}: ${message.slice(0, 80)}${message.length > 80 ? '...' : ''}`;

    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .insert({
        venue_id: venueId,
        created_by_user_id: appUserId,
        requester_name: name,
        requester_email: email,
        requester_phone: phone || null,
        requester_company: venueName || null,
        help_topic: helpTopic,
        subject,
        status: 'open',
        last_message_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (conversationError || !conversation) {
      throw conversationError || new Error('Failed to create conversation');
    }

    const { data: firstMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'user',
        sender_user_id: appUserId,
        message,
      })
      .select('*')
      .single();

    if (messageError || !firstMessage) {
      throw messageError || new Error('Failed to create first message');
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `TourBots Support <${SUPPORT_FROM_EMAIL}>`,
        to: [SUPPORT_INBOX_EMAIL],
        replyTo: email,
        subject: `New support conversation: ${helpTopic}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || 'Not provided'}`,
          `Company: ${venueName || 'Not provided'}`,
          `Topic: ${helpTopic}`,
          `Conversation ID: ${conversation.id}`,
          '',
          message,
        ].join('\n'),
      });

      if (error) {
        console.error('Resend support new conversation error:', error);
      } else {
        console.info('Resend support new conversation sent:', data?.id ?? 'no-message-id');
      }
    } catch (emailError) {
      console.error('Failed to send support conversation email:', emailError);
    }

    return NextResponse.json(
      {
        conversation,
        firstMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating support conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create support conversation' },
      { status: 500 }
    );
  }
}
