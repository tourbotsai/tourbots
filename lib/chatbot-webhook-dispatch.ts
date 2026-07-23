import { createHmac, randomBytes } from 'crypto';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { resolveSafeWebhookTarget, SafeWebhookTarget } from '@/lib/chatbot-webhook-ssrf';
import { postPinnedWebhook } from '@/lib/chatbot-webhook-fetch';

export const WEBHOOK_WRITE_TIMEOUT_MS = 4000;
export const WEBHOOK_QUERY_TIMEOUT_MS = 8000;
export const WEBHOOK_WRITE_MAX_RESPONSE_BYTES = 64 * 1024;
export const WEBHOOK_QUERY_MAX_RESPONSE_BYTES = 256 * 1024;

export type WebhookDeliveryMode = 'write' | 'query';

export interface WebhookDispatchInput {
  venueId: string;
  chatbotConfigId?: string | null;
  endpointId?: string | null;
  customActionId?: string | null;
  event: string;
  mode: WebhookDeliveryMode;
  url: string;
  signingSecret: string;
  body: Record<string, unknown>;
  timeoutMs?: number;
}

export interface WebhookDispatchResult {
  ok: boolean;
  status: number | null;
  responseJson: unknown | null;
  responseText: string | null;
  errorMessage: string | null;
  durationMs: number;
  deliveryId: string | null;
}

export function generateWebhookSigningSecret(): string {
  return randomBytes(32).toString('hex');
}

export function signWebhookPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

async function logDelivery(params: {
  venueId: string;
  chatbotConfigId?: string | null;
  endpointId?: string | null;
  customActionId?: string | null;
  event: string;
  mode: WebhookDeliveryMode;
  requestUrl: string;
  requestBody: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chatbot_webhook_deliveries')
      .insert({
        venue_id: params.venueId,
        chatbot_config_id: params.chatbotConfigId || null,
        endpoint_id: params.endpointId || null,
        custom_action_id: params.customActionId || null,
        event: params.event,
        mode: params.mode,
        request_url: params.requestUrl,
        request_body: params.requestBody,
        response_status: params.responseStatus,
        response_body: params.responseBody
          ? params.responseBody.slice(0, 8000)
          : null,
        error_message: params.errorMessage,
        duration_ms: params.durationMs,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Failed to log webhook delivery:', error);
      return null;
    }
    return data?.id || null;
  } catch (error) {
    console.error('Failed to log webhook delivery:', error);
    return null;
  }
}

function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/**
 * Signed HTTPS POST to a customer webhook (Zapier / Make / n8n).
 * Write mode: short timeout, success = 2xx ACK.
 * Query mode: waits for JSON body used as OpenAI tool output.
 */
export async function dispatchChatbotWebhook(
  input: WebhookDispatchInput
): Promise<WebhookDispatchResult> {
  const started = Date.now();
  const timeoutMs =
    input.timeoutMs ??
    (input.mode === 'query' ? WEBHOOK_QUERY_TIMEOUT_MS : WEBHOOK_WRITE_TIMEOUT_MS);

  let safeTarget: SafeWebhookTarget;
  try {
    safeTarget = await resolveSafeWebhookTarget(input.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unsafe webhook URL';
    const deliveryId = await logDelivery({
      venueId: input.venueId,
      chatbotConfigId: input.chatbotConfigId,
      endpointId: input.endpointId,
      customActionId: input.customActionId,
      event: input.event,
      mode: input.mode,
      requestUrl: input.url,
      requestBody: input.body,
      responseStatus: null,
      responseBody: null,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
    return {
      ok: false,
      status: null,
      responseJson: null,
      responseText: null,
      errorMessage: message,
      durationMs: Date.now() - started,
      deliveryId,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(input.body);
  const signature = signWebhookPayload(input.signingSecret, timestamp, rawBody);

  try {
    const response = await postPinnedWebhook({
      target: safeTarget,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TourBots-Webhooks/1.0',
        'X-TourBots-Event': input.event,
        'X-TourBots-Timestamp': timestamp,
        'X-TourBots-Signature': `sha256=${signature}`,
        'X-TourBots-Mode': input.mode,
      },
      body: rawBody,
      timeoutMs,
      maxResponseBytes:
        input.mode === 'query'
          ? WEBHOOK_QUERY_MAX_RESPONSE_BYTES
          : WEBHOOK_WRITE_MAX_RESPONSE_BYTES,
    });

    const responseText = response.body;
    const responseJson = tryParseJson(responseText);
    const ok = response.status >= 200 && response.status < 300;
    const durationMs = Date.now() - started;

    const deliveryId = await logDelivery({
      venueId: input.venueId,
      chatbotConfigId: input.chatbotConfigId,
      endpointId: input.endpointId,
      customActionId: input.customActionId,
      event: input.event,
      mode: input.mode,
      requestUrl: safeTarget.url.toString(),
      requestBody: input.body,
      responseStatus: response.status,
      responseBody: responseText,
      errorMessage: ok ? null : `HTTP ${response.status}`,
      durationMs,
    });

    return {
      ok,
      status: response.status,
      responseJson,
      responseText: responseText || null,
      errorMessage: ok ? null : `HTTP ${response.status}`,
      durationMs,
      deliveryId,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    const message = aborted
      ? `Webhook timed out after ${timeoutMs}ms`
      : error instanceof Error
        ? error.message
        : 'Webhook delivery failed';
    const durationMs = Date.now() - started;

    const deliveryId = await logDelivery({
      venueId: input.venueId,
      chatbotConfigId: input.chatbotConfigId,
      endpointId: input.endpointId,
      customActionId: input.customActionId,
      event: input.event,
      mode: input.mode,
      requestUrl: safeTarget.url.toString(),
      requestBody: input.body,
      responseStatus: null,
      responseBody: null,
      errorMessage: message,
      durationMs,
    });

    return {
      ok: false,
      status: null,
      responseJson: null,
      responseText: null,
      errorMessage: message,
      durationMs,
      deliveryId,
    };
  }
}

export async function getIntegrationEndpointForConfig(chatbotConfigId: string) {
  const { data, error } = await supabase
    .from('chatbot_integration_endpoints')
    .select('*')
    .eq('chatbot_config_id', chatbotConfigId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fire event webhooks subscribed on the chatbot's integration endpoint.
 * Never throws — failures are logged only.
 */
export async function emitChatbotEventWebhook(params: {
  venueId: string;
  chatbotConfigId: string;
  event: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const endpoint = await getIntegrationEndpointForConfig(params.chatbotConfigId);
    if (!endpoint || !endpoint.is_enabled) return;

    const subscribed: string[] = Array.isArray(endpoint.subscribed_events)
      ? endpoint.subscribed_events
      : [];
    if (!subscribed.includes(params.event)) return;

    const body = {
      event: params.event,
      mode: 'write' as const,
      venue_id: params.venueId,
      chatbot_config_id: params.chatbotConfigId,
      timestamp: new Date().toISOString(),
      ...params.payload,
    };

    // Fire-and-forget for event webhooks (write path).
    void dispatchChatbotWebhook({
      venueId: params.venueId,
      chatbotConfigId: params.chatbotConfigId,
      endpointId: endpoint.id,
      event: params.event,
      mode: 'write',
      url: endpoint.url,
      signingSecret: endpoint.signing_secret,
      body,
    }).catch((error) => {
      console.error(`Event webhook ${params.event} failed:`, error);
    });
  } catch (error) {
    console.error(`emitChatbotEventWebhook(${params.event}) error:`, error);
  }
}
