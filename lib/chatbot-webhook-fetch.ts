import { request } from 'node:https';
import { isIP } from 'node:net';
import { SafeWebhookTarget } from '@/lib/chatbot-webhook-ssrf';

export interface PinnedWebhookResponse {
  status: number;
  body: string;
}

export interface PostPinnedWebhookInput {
  target: SafeWebhookTarget;
  headers: Record<string, string>;
  body: string;
  timeoutMs: number;
  maxResponseBytes: number;
}

export class WebhookResponseTooLargeError extends Error {
  constructor(maxResponseBytes: number) {
    super(`Webhook response exceeded ${maxResponseBytes} bytes`);
    this.name = 'WebhookResponseTooLargeError';
  }
}

function createTimeoutError(timeoutMs: number): Error {
  const error = new Error(`Webhook timed out after ${timeoutMs}ms`);
  error.name = 'AbortError';
  return error;
}

/**
 * Sends an HTTPS request using only the addresses that passed SSRF validation.
 * The original hostname is still used for the Host header, TLS SNI, and
 * certificate verification.
 */
export function postPinnedWebhook(input: PostPinnedWebhookInput): Promise<PinnedWebhookResponse> {
  const { target } = input;
  let addressIndex = 0;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const requestInstance = request(
      {
        protocol: 'https:',
        hostname: target.hostname,
        port: target.url.port ? Number(target.url.port) : 443,
        path: `${target.url.pathname}${target.url.search}`,
        method: 'POST',
        headers: {
          Host: target.url.host,
          ...input.headers,
        },
        servername: target.hostname,
        rejectUnauthorized: true,
        lookup: (_hostname, _options, callback) => {
          const pinnedAddress = target.addresses[addressIndex % target.addresses.length];
          addressIndex += 1;
          callback(null, pinnedAddress.address, isIP(pinnedAddress.address) as 4 | 6);
        },
      },
      (response) => {
        const contentLength = Number(response.headers?.['content-length']);
        if (Number.isFinite(contentLength) && contentLength > input.maxResponseBytes) {
          const error = new WebhookResponseTooLargeError(input.maxResponseBytes);
          response.destroy(error);
          requestInstance.destroy(error);
          finish(() => reject(error));
          return;
        }

        const chunks: Buffer[] = [];
        let responseBytes = 0;
        response.on('data', (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          responseBytes += buffer.length;
          if (responseBytes > input.maxResponseBytes) {
            const error = new WebhookResponseTooLargeError(input.maxResponseBytes);
            response.destroy(error);
            requestInstance.destroy(error);
            finish(() => reject(error));
            return;
          }
          chunks.push(buffer);
        });
        response.on('error', (error) => finish(() => reject(error)));
        response.on('end', () => {
          finish(() =>
            resolve({
              status: response.statusCode || 0,
              body: Buffer.concat(chunks).toString('utf8'),
            })
          );
        });
      }
    );

    const timeout = setTimeout(() => {
      requestInstance.destroy(createTimeoutError(input.timeoutMs));
    }, input.timeoutMs);

    requestInstance.once('error', (error) => finish(() => reject(error)));
    requestInstance.end(input.body);
  });
}
