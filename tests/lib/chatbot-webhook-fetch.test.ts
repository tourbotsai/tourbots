// @vitest-environment node

import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('node:https', () => ({
  request: mocks.request,
}));

import { postPinnedWebhook } from '@/lib/chatbot-webhook-fetch';

describe('postPinnedWebhook', () => {
  it('uses the validated address while retaining the hostname for HTTPS', async () => {
    let capturedOptions: Record<string, unknown> | undefined;
    mocks.request.mockImplementation((options: Record<string, unknown>, onResponse: (response: EventEmitter) => void) => {
      capturedOptions = options;
      const request = new EventEmitter() as EventEmitter & {
        end: (body: string) => void;
        destroy: (error: Error) => void;
      };
      request.end = () => {
        const response = new EventEmitter() as EventEmitter & { statusCode?: number };
        response.statusCode = 200;
        onResponse(response);
        queueMicrotask(() => response.emit('end'));
      };
      request.destroy = (error) => request.emit('error', error);
      return request;
    });

    const response = await postPinnedWebhook({
      target: {
        url: new URL('https://webhook.example:8443/path?query=value'),
        hostname: 'webhook.example',
        addresses: [{ address: '93.184.216.34', family: 4 }],
      },
      headers: { 'X-Test': 'true' },
      body: '{"message":"hello"}',
      timeoutMs: 1000,
      maxResponseBytes: 1024,
    });

    expect(response).toEqual({ status: 200, body: '' });
    expect(capturedOptions).toMatchObject({
      hostname: 'webhook.example',
      port: 8443,
      path: '/path?query=value',
      servername: 'webhook.example',
      rejectUnauthorized: true,
      headers: { Host: 'webhook.example:8443', 'X-Test': 'true' },
    });

    const lookup = capturedOptions?.lookup as (
      hostname: string,
      options: object,
      callback: (error: Error | null, address: string, family: number) => void
    ) => void;
    const callback = vi.fn();
    lookup('webhook.example', {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4);
  });
});
