// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase-service-role', () => ({
  supabaseServiceRole: {
    rpc: mocks.rpc,
  },
}));

import { recordMenuEventWithRateLimit } from '@/lib/embed-menu-event-rate-limiter';

const input = {
  embedId: 'tour-widget-example',
  venueId: 'ad211eed-7ded-47d0-b001-d0f3ff9a4a76',
  tourId: '8a439997-4bc2-4f7f-b0cb-7f8cb469673f',
  eventType: 'menu_opened' as const,
  menuStyle: 'drawer' as const,
  ipAddress: '203.0.113.10',
};

describe('recordMenuEventWithRateLimit', () => {
  it('records through the atomic database RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ accepted: true, message: null }], error: null });

    await expect(recordMenuEventWithRateLimit(input)).resolves.toEqual({ allowed: true });
    expect(mocks.rpc).toHaveBeenCalledWith('record_embed_menu_event', {
      p_venue_id: input.venueId,
      p_ip_address: input.ipAddress,
      p_event: expect.objectContaining({
        embed_id: input.embedId,
        tour_id: input.tourId,
        event_type: input.eventType,
        menu_style: input.menuStyle,
      }),
    });
  });

  it('returns a rate-limit response without writing a separate event', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ accepted: false, message: 'Too many menu events from this network.' }],
      error: null,
    });

    await expect(recordMenuEventWithRateLimit(input)).resolves.toEqual({
      allowed: false,
      message: 'Too many menu events from this network.',
    });
  });
});
