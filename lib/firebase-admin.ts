import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { createHash } from 'crypto';

// Initialize Firebase Admin only if it hasn't been initialized already
export function initAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

// Initialize Firebase Admin if needed
initAdmin();

type TokenCacheEntry = {
  decodedToken: DecodedIdToken;
  cachedAtMs: number;
  tokenExpiresAtMs: number;
};

const DEFAULT_VERIFY_CACHE_TTL_SECONDS = 120;
const MIN_VERIFY_CACHE_TTL_SECONDS = 10;
const MAX_VERIFY_CACHE_TTL_SECONDS = 600;

function getVerifyCacheTtlMs(): number {
  const rawValue = Number(
    process.env.AUTH_TOKEN_VERIFY_CACHE_TTL_SECONDS ||
      process.env.AUTH_CONTEXT_CACHE_TTL_SECONDS ||
      DEFAULT_VERIFY_CACHE_TTL_SECONDS
  );
  if (!Number.isFinite(rawValue)) return DEFAULT_VERIFY_CACHE_TTL_SECONDS * 1000;
  const boundedSeconds = Math.min(
    MAX_VERIFY_CACHE_TTL_SECONDS,
    Math.max(MIN_VERIFY_CACHE_TTL_SECONDS, Math.floor(rawValue))
  );
  return boundedSeconds * 1000;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getTokenVerifyCache(): Map<string, TokenCacheEntry> {
  const globalScope = globalThis as typeof globalThis & {
    __tbFirebaseVerifyTokenCache?: Map<string, TokenCacheEntry>;
  };

  if (!globalScope.__tbFirebaseVerifyTokenCache) {
    globalScope.__tbFirebaseVerifyTokenCache = new Map<string, TokenCacheEntry>();
  }

  return globalScope.__tbFirebaseVerifyTokenCache;
}

function isCacheEntryFresh(entry: TokenCacheEntry, nowMs: number, ttlMs: number): boolean {
  return nowMs - entry.cachedAtMs < ttlMs && nowMs < entry.tokenExpiresAtMs;
}

function clearStaleVerifyEntries(cache: Map<string, TokenCacheEntry>, nowMs: number, ttlMs: number) {
  cache.forEach((entry, key) => {
    if (!isCacheEntryFresh(entry, nowMs, ttlMs)) {
      cache.delete(key);
    }
  });
}

const firebaseAuth = getAuth();
const rawVerifyIdToken = firebaseAuth.verifyIdToken.bind(firebaseAuth);

firebaseAuth.verifyIdToken = async (idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken> => {
  // Revocation checks should always hit Firebase directly.
  if (checkRevoked) {
    return rawVerifyIdToken(idToken, true);
  }

  const ttlMs = getVerifyCacheTtlMs();
  const nowMs = Date.now();
  const cache = getTokenVerifyCache();
  clearStaleVerifyEntries(cache, nowMs, ttlMs);

  const cacheKey = hashToken(idToken);
  const existing = cache.get(cacheKey);
  if (existing && isCacheEntryFresh(existing, nowMs, ttlMs)) {
    return existing.decodedToken;
  }

  const decodedToken = await rawVerifyIdToken(idToken);
  cache.set(cacheKey, {
    decodedToken,
    cachedAtMs: nowMs,
    tokenExpiresAtMs: (decodedToken.exp || 0) * 1000,
  });

  return decodedToken;
};

// Export the auth service
export const auth = firebaseAuth;