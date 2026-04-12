import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import { getScopedTourChatbotConfig, updateScopedTourChatbotConfig } from '@/lib/agency-portal-module-service';

const DEFAULT_TOUR_CHATBOT_NAME = 'Tour Assistant';
const DEFAULT_TOUR_GUARDRAIL_PROMPT =
  'You are an AI assistant for this virtual tour. Only answer questions about this location, its spaces, and the virtual tour experience. If a question is unrelated, politely explain that you can only help with tour and location questions.';
const DEFAULT_TOUR_INSTRUCTION_PROMPT =
  'Guide visitors through the virtual tour clearly and concisely. Focus on what they can see in this location and help them navigate the space.';

function textOrDefault(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

async function getScopedConfigById(configId: string, venueId: string, tourId: string) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select('*')
    .eq('id', configId)
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
    });
    if (session instanceof NextResponse) return session;

    const config = await getScopedTourChatbotConfig(session.venueId, session.tourId);
    return NextResponse.json(config || null);
  } catch (error: any) {
    console.error('Agency portal chatbot-config GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot config.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const configId = payload?.configId as string | undefined;
    const updates = payload?.updates as Record<string, unknown> | undefined;
    if (!configId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'configId and updates are required.' }, { status: 400 });
    }

    const existing = await getScopedConfigById(configId, session.venueId, session.tourId);
    if (!existing) {
      return NextResponse.json({ error: 'Chatbot config not found for share scope.' }, { status: 404 });
    }

    const safeUpdates: Record<string, unknown> = {
      chatbot_name: updates.chatbot_name,
      welcome_message: updates.welcome_message,
      personality_prompt: updates.personality_prompt,
      instruction_prompt: updates.instruction_prompt,
      guardrails_enabled: updates.guardrails_enabled,
      guardrail_prompt: updates.guardrail_prompt,
      is_active: updates.is_active,
    };

    const updated = await updateScopedTourChatbotConfig(session.venueId, session.tourId, safeUpdates);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update chatbot config.' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Agency portal chatbot-config PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot config.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const existing = await getScopedTourChatbotConfig(session.venueId, session.tourId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const incomingConfig = payload?.config || {};
    const venueLookup = await supabase
      .from('venues')
      .select('name')
      .eq('id', session.venueId)
      .single();

    if (venueLookup.error || !venueLookup.data) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 });
    }

    let vectorStoreId: string | null = null;
    try {
      const vectorStore = await openAIService.createVectorStore(`${venueLookup.data.name} - Virtual Tour Chatbot`);
      vectorStoreId = vectorStore.id;
    } catch (openAIError) {
      console.warn('Agency portal create config without vector store:', openAIError);
    }

    const { data, error } = await supabase
      .from('chatbot_configs')
      .insert([
        {
          venue_id: session.venueId,
          tour_id: session.tourId,
          chatbot_type: 'tour',
          openai_vector_store_id: vectorStoreId,
          ...incomingConfig,
          chatbot_name: textOrDefault(incomingConfig?.chatbot_name, DEFAULT_TOUR_CHATBOT_NAME),
          instruction_prompt: textOrDefault(incomingConfig?.instruction_prompt, DEFAULT_TOUR_INSTRUCTION_PROMPT),
          guardrail_prompt: textOrDefault(incomingConfig?.guardrail_prompt, DEFAULT_TOUR_GUARDRAIL_PROMPT),
          guardrails_enabled:
            typeof incomingConfig?.guardrails_enabled === 'boolean'
              ? incomingConfig.guardrails_enabled
              : true,
          is_active:
            typeof incomingConfig?.is_active === 'boolean'
              ? incomingConfig.is_active
              : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      if (vectorStoreId) {
        try {
          await openAIService.deleteVectorStore(vectorStoreId);
        } catch (cleanupError) {
          console.error('Failed to clean up vector store after create failure:', cleanupError);
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Agency portal chatbot-config POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot config.' },
      { status: 500 }
    );
  }
}
