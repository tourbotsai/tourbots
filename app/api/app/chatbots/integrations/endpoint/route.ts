import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  ensureIntegrationAdmin,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';
import { assertSafeWebhookUrl } from '@/lib/chatbot-webhook-ssrf';
import { generateWebhookSigningSecret } from '@/lib/chatbot-webhook-dispatch';
import { ChatbotIntegrationEndpoint } from '@/lib/types';

const ALLOWED_EVENTS = ['lead.created'] as const;

const putSchema = z.object({
  chatbotConfigId: z.string().uuid(),
  url: z.string().url().optional().nullable(),
  is_enabled: z.boolean().optional(),
  subscribed_events: z.array(z.string()).optional(),
  rotate_secret: z.boolean().optional(),
});

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
  return data as { id: string; venue_id: string; tour_id: string | null };
}

function sanitiseEvents(input?: string[]): string[] {
  return (input || [])
    .map((value) => value.trim())
    .filter((value): value is (typeof ALLOWED_EVENTS)[number] =>
      (ALLOWED_EVENTS as readonly string[]).includes(value)
    );
}

function serialiseEndpoint(
  endpoint: ChatbotIntegrationEndpoint,
  revealSecret = false
): ChatbotIntegrationEndpoint & { has_signing_secret: boolean; signing_secret_preview: string | null } {
  const secret = endpoint.signing_secret || '';
  return {
    ...endpoint,
    signing_secret: revealSecret ? secret : undefined,
    has_signing_secret: Boolean(secret),
    signing_secret_preview: secret ? `…${secret.slice(-6)}` : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const chatbotConfigId = new URL(request.url).searchParams.get('chatbotConfigId');
    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    const authorisationError = ensureIntegrationAdmin(authResult);
    if (authorisationError) return authorisationError;

    await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);

    const { data, error } = await supabase
      .from('chatbot_integration_endpoints')
      .select('*')
      .eq('chatbot_config_id', chatbotConfigId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      endpoint: data ? serialiseEndpoint(data as ChatbotIntegrationEndpoint) : null,
      allowedEvents: ALLOWED_EVENTS,
    });
  } catch (error: unknown) {
    console.error('GET integration endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load endpoint';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    const authorisationError = ensureIntegrationAdmin(authResult);
    if (authorisationError) return authorisationError;

    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid input: ${parsed.error.errors.map((e) => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const config = await resolveConfig(data.chatbotConfigId, authResult.venueId, authResult.role);

    const { data: existing } = await supabase
      .from('chatbot_integration_endpoints')
      .select('*')
      .eq('chatbot_config_id', data.chatbotConfigId)
      .maybeSingle();

    const rawUrl = (data.url ?? existing?.url ?? '').trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    await assertSafeWebhookUrl(rawUrl);

    const signingSecret =
      data.rotate_secret || !existing?.signing_secret
        ? generateWebhookSigningSecret()
        : existing.signing_secret;

    const payload = {
      chatbot_config_id: config.id,
      venue_id: config.venue_id,
      tour_id: config.tour_id,
      url: rawUrl,
      signing_secret: signingSecret,
      is_enabled: data.is_enabled ?? existing?.is_enabled ?? true,
      subscribed_events: sanitiseEvents(data.subscribed_events ?? existing?.subscribed_events),
    };

    const { data: saved, error } = await supabase
      .from('chatbot_integration_endpoints')
      .upsert(payload, { onConflict: 'chatbot_config_id' })
      .select('*')
      .single();

    if (error || !saved) {
      throw new Error(error?.message || 'Failed to save endpoint');
    }

    logChatbotAudit(
      existing ? 'integration_endpoint_updated' : 'integration_endpoint_created',
      authResult,
      { chatbot_config_id: config.id, endpoint_id: saved.id, is_enabled: saved.is_enabled }
    );

    return NextResponse.json({
      endpoint: serialiseEndpoint(
        saved as ChatbotIntegrationEndpoint,
        !existing || data.rotate_secret === true
      ),
    });
  } catch (error: unknown) {
    console.error('PUT integration endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save endpoint';
    const status = message.includes('Webhook') || message.includes('private') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const chatbotConfigId = new URL(request.url).searchParams.get('chatbotConfigId');
    if (!chatbotConfigId) {
      return NextResponse.json({ error: 'chatbotConfigId is required' }, { status: 400 });
    }

    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;
    const authorisationError = ensureIntegrationAdmin(authResult);
    if (authorisationError) return authorisationError;

    await resolveConfig(chatbotConfigId, authResult.venueId, authResult.role);

    const { error } = await supabase
      .from('chatbot_integration_endpoints')
      .delete()
      .eq('chatbot_config_id', chatbotConfigId);

    if (error) throw new Error(error.message);

    logChatbotAudit('integration_endpoint_deleted', authResult, {
      chatbot_config_id: chatbotConfigId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE integration endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete endpoint';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
