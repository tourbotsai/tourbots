// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  trackEmbedView: vi.fn(),
  trackEmbedTourMove: vi.fn(),
  recordMenuEventWithRateLimit: vi.fn(),
}));

vi.mock('@/lib/embed-analytics', () => ({
  trackEmbedView: mocks.trackEmbedView,
  trackEmbedTourMove: mocks.trackEmbedTourMove,
}));

vi.mock('@/lib/embed-menu-event-rate-limiter', () => ({
  recordMenuEventWithRateLimit: mocks.recordMenuEventWithRateLimit,
}));

import { POST as trackView } from '@/app/api/public/embed/track/route';
import { POST as trackMove } from '@/app/api/public/embed/track-tour-move/route';
import { POST as trackMenuEvent } from '@/app/api/public/embed/track-menu-event/route';
import { createPublicEmbedToken } from '@/lib/public-embed-token';

const venueId = 'a2d93e31-d959-48d7-81c1-5b8322f4f6e1';
const tourId = '92fd0de1-0164-4b8f-b6be-31a8124859d9';
const embedId = 'tour-embed-1';

function request(path: string, body: unknown): NextRequest {
  return new NextRequest(`https://tourbots.ai${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('public embed tracking authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_CHATBOT_EMBED_TOKEN_SECRET', 'test-embed-token-secret');
    mocks.recordMenuEventWithRateLimit.mockResolvedValue({ allowed: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects a view event with no signed embed capability', async () => {
    const response = await trackView(request('/api/public/embed/track', {
      embedId,
      venueId,
      type: 'tour',
    }));

    expect(response.status).toBe(403);
    expect(mocks.trackEmbedView).not.toHaveBeenCalled();
  });

  it('rejects a move event with an invalid signed embed capability', async () => {
    const response = await trackMove(request('/api/public/embed/track-tour-move', {
      embedId,
      embedToken: 'invalid',
      venueId,
      tourId,
      sweepId: 'sweep-1',
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5 },
    }));

    expect(response.status).toBe(403);
    expect(mocks.trackEmbedTourMove).not.toHaveBeenCalled();
  });

  it('rejects a menu event with no signed embed capability', async () => {
    const response = await trackMenuEvent(request('/api/public/embed/track-menu-event', {
      embedId,
      venueId,
      tourId,
      eventType: 'menu_opened',
    }));

    expect(response.status).toBe(403);
    expect(mocks.recordMenuEventWithRateLimit).not.toHaveBeenCalled();
  });

  it('records authenticated view, move and menu events', async () => {
    const embedToken = createPublicEmbedToken(venueId, embedId);
    expect(embedToken).toBeTruthy();

    const viewResponse = await trackView(request('/api/public/embed/track', {
      embedId,
      embedToken,
      venueId,
      type: 'tour',
      domain: 'customer.example',
      pageUrl: 'https://customer.example/tour',
      tourId,
    }));
    const moveResponse = await trackMove(request('/api/public/embed/track-tour-move', {
      embedId,
      embedToken,
      venueId,
      tourId,
      sweepId: 'sweep-1',
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5 },
      domain: 'customer.example',
      pageUrl: 'https://customer.example/tour',
    }));
    const menuResponse = await trackMenuEvent(request('/api/public/embed/track-menu-event', {
      embedId,
      embedToken,
      venueId,
      tourId,
      eventType: 'menu_opened',
      domain: 'customer.example',
      pageUrl: 'https://customer.example/tour',
    }));

    expect(viewResponse.status).toBe(200);
    expect(moveResponse.status).toBe(200);
    expect(menuResponse.status).toBe(200);
    expect(mocks.trackEmbedView).toHaveBeenCalledWith(
      embedId,
      venueId,
      'tour',
      'customer.example',
      'https://customer.example/tour',
      undefined,
      undefined,
      tourId
    );
    expect(mocks.trackEmbedTourMove).toHaveBeenCalledWith(expect.objectContaining({
      embedId,
      venueId,
      tourId,
      domain: 'customer.example',
      pageUrl: 'https://customer.example/tour',
    }));
    expect(mocks.recordMenuEventWithRateLimit).toHaveBeenCalledWith(expect.objectContaining({
      embedId,
      venueId,
      tourId,
      domain: 'customer.example',
      pageUrl: 'https://customer.example/tour',
    }));
  });
});

describe('tour embed tracking emitters', () => {
  it('keeps analytics inside the authenticated iframe', () => {
    const loader = readFileSync(resolve(process.cwd(), 'public/embed/tour.js'), 'utf8');
    const client = readFileSync(
      resolve(process.cwd(), 'app/embed/tour/[venueId]/tour-embed-client.tsx'),
      'utf8'
    );

    expect(loader).not.toContain('trackTourView');
    expect(loader).not.toContain('/api/public/embed/track');
    expect(loader).not.toContain('track-pixel');
    expect(client).toContain("fetch('/api/public/embed/track'");
    expect(client).toContain("fetch('/api/public/embed/track-tour-move'");
    expect(client).toContain('embedToken,');
    expect(client).toContain('tourId: locationScopeTourId');
    expect(client).toContain('domain: ctx.domain');
    expect(client).toContain('pageUrl: ctx.pageUrl');
  });
});
