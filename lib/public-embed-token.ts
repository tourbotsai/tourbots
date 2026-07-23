import { createHmac, timingSafeEqual } from 'crypto';
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

export function createPublicEmbedToken(venueId: string, embedId: string): string | null {
  const secret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PUBLIC_CHATBOT_EMBED_TOKEN_SECRET is required in production');
    }
    return null;
  }

  const payload = Buffer.from(
    JSON.stringify({
      v: venueId,
      e: embedId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    })
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyPublicEmbedToken(params: {
  token: string;
  venueId: string;
  embedId: string;
}): boolean {
  const secret = process.env.PUBLIC_CHATBOT_EMBED_TOKEN_SECRET;
  if (!secret) return false;

  const [payloadBase64, signature] = params.token.split('.');
  if (!payloadBase64 || !signature) return false;

  const expectedSignature = createHmac('sha256', secret).update(payloadBase64).digest('hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as {
      v?: string;
      e?: string;
      exp?: number;
    };
    return (
      payload.v === params.venueId &&
      payload.e === params.embedId &&
      typeof payload.exp === 'number' &&
      payload.exp >= Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function verifyPublicEmbedRequest(params: {
  // Retained for callers that use the request for unrelated context. It must
  // never influence capability authorisation because Origin/Referer are
  // caller-controlled headers.
  request?: unknown;
  token: unknown;
  venueId: string;
  embedId: string;
}): boolean {
  return (
    typeof params.token === 'string' &&
    verifyPublicEmbedToken({
      token: params.token,
      venueId: params.venueId,
      embedId: params.embedId,
    })
  );
}
