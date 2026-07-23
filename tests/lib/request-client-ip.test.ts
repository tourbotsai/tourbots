// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClientIp, normaliseIpAddress } from '../../lib/request-client-ip';

const requestWithHeaders = (headers: Record<string, string>) => ({
  headers: new Headers(headers),
});

describe('getClientIp', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers the Vercel client IP and normalises it', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      getClientIp(
        requestWithHeaders({
          'x-vercel-forwarded-for': ' 2001:0DB8:0000:0000:0000:0000:0000:0001 ',
          'x-real-ip': '203.0.113.9',
        })
      )
    ).toBe('2001:db8::1');
  });

  it('falls back to a valid x-real-ip when Vercel IP is absent or invalid', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      getClientIp(
        requestWithHeaders({
          'x-vercel-forwarded-for': 'not-an-ip',
          'x-real-ip': '203.0.113.9',
        })
      )
    ).toBe('203.0.113.9');
  });

  it('does not trust generic forwarding or remote-address headers', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      getClientIp(
        requestWithHeaders({
          'x-forwarded-for': '198.51.100.20',
          'x-remote-addr': '198.51.100.21',
        })
      )
    ).toBe('unknown');
  });

  it('uses a stable localhost fallback only during development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(getClientIp(requestWithHeaders({}))).toBe('127.0.0.1');
  });
});

describe('normaliseIpAddress', () => {
  it('rejects non-IP values and normalises bracketed IPv6 values', () => {
    expect(normaliseIpAddress('unknown')).toBeNull();
    expect(normaliseIpAddress('192.0.2.999')).toBeNull();
    expect(normaliseIpAddress('[::ffff:192.0.2.128]')).toBe('::ffff:c000:280');
  });
});
