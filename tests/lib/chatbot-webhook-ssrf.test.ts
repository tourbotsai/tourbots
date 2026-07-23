// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
}));

vi.mock('dns/promises', () => ({
  lookup: mocks.lookup,
}));

import {
  assertSafeWebhookUrl,
  resolveSafeWebhookTarget,
} from '@/lib/chatbot-webhook-ssrf';

describe('resolveSafeWebhookTarget', () => {
  it('returns the validated DNS answers for delivery-time pinning', async () => {
    mocks.lookup.mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);

    const target = await resolveSafeWebhookTarget('https://webhook.example/path?source=chatbot');

    expect(target.hostname).toBe('webhook.example');
    expect(target.url.toString()).toBe('https://webhook.example/path?source=chatbot');
    expect(target.addresses).toEqual([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);
    expect(mocks.lookup).toHaveBeenCalledWith('webhook.example', { all: true, verbatim: true });
  });

  it('rejects any hostname that resolves to a private address', async () => {
    mocks.lookup.mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
      { address: '169.254.169.254', family: 4 },
    ]);

    await expect(resolveSafeWebhookTarget('https://webhook.example')).rejects.toThrow(
      'private or reserved IP address'
    );
  });

  it('rejects IPv4-mapped IPv6 addresses that map to loopback or private networks', async () => {
    await expect(resolveSafeWebhookTarget('https://[::ffff:127.0.0.1]')).rejects.toThrow(
      'private IP address'
    );
    await expect(resolveSafeWebhookTarget('https://[::ffff:192.168.1.1]')).rejects.toThrow(
      'private IP address'
    );
  });

  it('keeps save-time validation compatible with the existing URL-only API', async () => {
    mocks.lookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);

    await expect(assertSafeWebhookUrl('https://webhook.example')).resolves.toMatchObject({
      hostname: 'webhook.example',
    });
  });
});
