// @vitest-environment node

import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  assertSafeWebhookUrl: vi.fn(),
  logChatbotAudit: vi.fn(),
  ensureIntegrationAdmin: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/supabase-service-role', () => {
  const configQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  configQuery.eq.mockReturnValue(configQuery);
  configQuery.maybeSingle.mockResolvedValue({
    data: {
      id: '8a439997-4bc2-4f7f-b0cb-7f8cb469673f',
      venue_id: 'ad211eed-7ded-47d0-b001-d0f3ff9a4a76',
      tour_id: null,
    },
    error: null,
  });

  return {
    supabaseServiceRole: {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => {
          if (table === 'chatbot_custom_actions') {
            const actionsQuery = {
              eq: vi.fn(),
              order: vi.fn(),
            };
            actionsQuery.eq.mockReturnValue(actionsQuery);
            actionsQuery.order.mockResolvedValue({ data: [], error: null });
            return actionsQuery;
          }
          return configQuery;
        }),
      })),
      rpc: mocks.rpc,
    },
  };
});

vi.mock('@/lib/chatbot-route-auth', () => ({
  authenticateChatbotRoute: vi.fn().mockResolvedValue({
    venueId: 'ad211eed-7ded-47d0-b001-d0f3ff9a4a76',
    role: 'venue_admin',
  }),
  ensureIntegrationAdmin: mocks.ensureIntegrationAdmin,
  logChatbotAudit: mocks.logChatbotAudit,
}));

vi.mock('@/lib/chatbot-webhook-ssrf', () => ({
  assertSafeWebhookUrl: mocks.assertSafeWebhookUrl,
}));

import { PUT } from '@/app/api/app/chatbots/integrations/custom-actions/route';

describe('custom action replacement route', () => {
  it('uses the atomic replacement RPC with normalised action payloads', async () => {
    const savedActions = [
      {
        id: 'b69ec1ef-c8e5-4a0b-93c5-53f0c01a8d7a',
        action_key: 'get_availability',
        signing_secret: 'existing-secret',
      },
    ];
    mocks.assertSafeWebhookUrl.mockResolvedValue(new URL('https://hooks.example/action'));
    mocks.rpc.mockResolvedValue({ data: savedActions, error: null });

    const response = await PUT(
      new NextRequest('http://localhost/api/app/chatbots/integrations/custom-actions', {
        method: 'PUT',
        body: JSON.stringify({
          chatbotConfigId: '8a439997-4bc2-4f7f-b0cb-7f8cb469673f',
          actions: [
            {
              name: ' Get availability ',
              action_key: 'get_availability',
              mode: 'query',
              is_active: true,
              description: ' Check available slots ',
              webhook_url: 'https://hooks.example/action',
              condition_type: 'keywords',
              condition_keywords: [' Availability ', ''],
              display_order: 2,
              rotate_secret: false,
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      actions: [
        {
          ...savedActions[0],
          can_rotate_secret: true,
        },
      ],
    });
    expect(mocks.rpc).toHaveBeenCalledWith('replace_chatbot_custom_actions', {
      p_chatbot_config_id: '8a439997-4bc2-4f7f-b0cb-7f8cb469673f',
      p_venue_id: 'ad211eed-7ded-47d0-b001-d0f3ff9a4a76',
      p_tour_id: null,
      p_actions: [
        {
          name: 'Get availability',
          action_key: 'get_availability',
          mode: 'query',
          is_active: true,
          description: 'Check available slots',
          webhook_url: 'https://hooks.example/action',
          condition_type: 'keywords',
          condition_keywords: ['availability'],
          condition_intent: null,
          condition_message_count: null,
          display_order: 2,
          rotate_secret: false,
        },
      ],
    });
    expect(mocks.logChatbotAudit).toHaveBeenCalledWith(
      'custom_actions_updated',
      expect.any(Object),
      expect.objectContaining({ count: 1 })
    );
  });

  it('returns a server error when the atomic replacement fails', async () => {
    mocks.assertSafeWebhookUrl.mockResolvedValue(new URL('https://hooks.example/action'));
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'database rejected update' } });

    const response = await PUT(
      new NextRequest('http://localhost/api/app/chatbots/integrations/custom-actions', {
        method: 'PUT',
        body: JSON.stringify({
          chatbotConfigId: '8a439997-4bc2-4f7f-b0cb-7f8cb469673f',
          actions: [],
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'database rejected update' });
  });
});
