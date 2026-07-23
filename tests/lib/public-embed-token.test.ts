// @vitest-environment node

import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPublicEmbedToken,
  verifyPublicEmbedRequest,
} from '@/lib/public-embed-token';

const venueId = 'a2d93e31-d959-48d7-81c1-5b8322f4f6e1';
const embedId = 'tour-widget-a2d93e31-d959-48d7-81c1-5b8322f4f6e1';

describe('verifyPublicEmbedRequest', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects a forged first-party Origin without a capability', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest('https://tourbots.ai/api/public/tour-chatbot/' + venueId, {
      headers: { origin: 'https://tourbots.ai' },
    });

    expect(verifyPublicEmbedRequest({ request, token: undefined, venueId, embedId })).toBe(false);
  });

  it('still requires a capability for third-party embed callers', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest('https://tourbots.ai/api/public/tour-chatbot/' + venueId, {
      headers: { origin: 'https://customer.example' },
    });

    expect(verifyPublicEmbedRequest({ request, token: undefined, venueId, embedId })).toBe(false);
  });

  it('accepts a valid capability regardless of the request Origin', () => {
    vi.stubEnv('PUBLIC_CHATBOT_EMBED_TOKEN_SECRET', 'test-secret');
    const token = createPublicEmbedToken(venueId, embedId);
    const request = new NextRequest('https://tourbots.ai/api/public/tour-chatbot/' + venueId, {
      headers: { origin: 'https://customer.example' },
    });

    expect(verifyPublicEmbedRequest({ request, token, venueId, embedId })).toBe(true);
  });
});
