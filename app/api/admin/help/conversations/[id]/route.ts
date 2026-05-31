import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

const updateConversationSchema = z
  .object({
    subject: z.string().trim().max(200, 'Conversation name is too long.').optional(),
    status: z.enum(['open', 'closed']).optional(),
  })
  .refine((data) => data.subject !== undefined || data.status !== undefined, {
    message: 'No fields provided to update.',
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = updateConversationSchema.safeParse(body);

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

    const updatePayload: { subject?: string | null; status?: 'open' | 'closed' } = {};
    if (parsed.data.subject !== undefined) {
      updatePayload.subject = parsed.data.subject.length > 0 ? parsed.data.subject : null;
    }
    if (parsed.data.status !== undefined) {
      updatePayload.status = parsed.data.status;
    }

    const { data: updatedConversation, error: updateError } = await supabase
      .from('support_conversations')
      .update(updatePayload)
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError || !updatedConversation) {
      throw updateError || new Error('Failed to update conversation');
    }

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error: any) {
    console.error('Error updating admin support conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
