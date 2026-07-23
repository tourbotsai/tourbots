// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getScopedChatbotConfig: vi.fn(),
  getScopedVenueId: vi.fn(),
  ensureVenueScope: vi.fn(),
  ensureTourScope: vi.fn(),
  authenticateChatbotRoute: vi.fn(),
  logChatbotAudit: vi.fn(),
  createVectorStore: vi.fn(),
  deleteVectorStore: vi.fn(),
  assertBotAvailable: vi.fn(),
}));

vi.mock('@/lib/supabase-service-role', () => ({
  supabaseServiceRole: {
    from: mocks.from,
  },
}));

vi.mock('@/lib/chatbot-route-auth', () => ({
  authenticateChatbotRoute: mocks.authenticateChatbotRoute,
  getScopedVenueId: mocks.getScopedVenueId,
  ensureTourScope: mocks.ensureTourScope,
  ensureVenueScope: mocks.ensureVenueScope,
  getScopedChatbotConfig: mocks.getScopedChatbotConfig,
  logChatbotAudit: mocks.logChatbotAudit,
}));

vi.mock('@/lib/openai-service', () => ({
  openAIService: {
    createVectorStore: mocks.createVectorStore,
    deleteVectorStore: mocks.deleteVectorStore,
  },
}));

vi.mock('@/lib/chatbot-customisation-service', () => ({
  getAdvancedDefaultCustomisation: vi.fn(),
}));

vi.mock('@/lib/server/chatbot-customisation-db', () => ({
  getChatbotCustomisation: vi.fn(),
  upsertChatbotCustomisation: vi.fn(),
}));

vi.mock('@/lib/server/venue-bot-limits', () => ({
  assertBotAvailable: mocks.assertBotAvailable,
}));

import { POST, PUT } from '@/app/api/app/chatbots/config/route';

const venueId = 'a2d93e31-d959-48d7-81c1-5b8322f4f6e1';
const otherVenueId = 'e83bb3e0-7815-40b0-bc3a-6380a0e6c7b2';
const configId = '92fd0de1-0164-4b8f-b6be-31a8124859d9';

describe('chatbot configuration route scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateChatbotRoute.mockResolvedValue({
      userId: 'user-1',
      firebaseUid: 'firebase-user-1',
      role: 'venue_admin',
      venueId,
    });
    mocks.getScopedVenueId.mockReturnValue(venueId);
    mocks.ensureVenueScope.mockReturnValue(null);
    mocks.getScopedChatbotConfig.mockResolvedValue({
      id: configId,
      venue_id: venueId,
      tour_id: null,
      chatbot_type: 'website',
    });
  });

  it('rejects a create payload that attempts to override the venue scope', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/app/chatbots/config', {
        method: 'POST',
        body: JSON.stringify({
          venueId,
          chatbotType: 'website',
          config: {
            venue_id: otherVenueId,
            chatbot_name: 'Forged ownership',
          },
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining('Unrecognized key') })
    );
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.createVectorStore).not.toHaveBeenCalled();
  });

  it('rejects an update payload that attempts to move a configuration', async () => {
    const response = await PUT(
      new NextRequest('http://localhost/api/app/chatbots/config', {
        method: 'PUT',
        body: JSON.stringify({
          configId,
          updates: { venue_id: otherVenueId },
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.getScopedChatbotConfig).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('persists a valid allowlisted settings update', async () => {
    const update = vi.fn();
    const eq = vi.fn();
    const select = vi.fn();
    const single = vi.fn().mockResolvedValue({
      data: { id: configId, venue_id: venueId, chatbot_name: 'Updated assistant' },
      error: null,
    });
    update.mockReturnValue({ eq });
    eq.mockReturnValue({ select });
    select.mockReturnValue({ single });
    mocks.from.mockReturnValue({ update });

    const response = await PUT(
      new NextRequest('http://localhost/api/app/chatbots/config', {
        method: 'PUT',
        body: JSON.stringify({
          configId,
          updates: { chatbot_name: ' Updated assistant ' },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ chatbot_name: 'Updated assistant' })
    );
    expect(mocks.logChatbotAudit).toHaveBeenCalledWith(
      'chatbot_config_updated',
      expect.any(Object),
      { config_id: configId }
    );
  });
});
