import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { auth, initAdmin } from '@/lib/firebase-admin';
import { getUserByFirebaseUid, getUserWithVenue } from '@/lib/user-service';
import { User, UserWithVenue } from '@/lib/types';

initAdmin();

const DEFAULT_CACHE_TTL_SECONDS = 120;
const MIN_CACHE_TTL_SECONDS = 10;
const MAX_CACHE_TTL_SECONDS = 600;

type TokenCacheEntry = {
  uid: string;
  tokenExpiresAtMs: number;
  cachedAtMs: number;
};

type UserCacheEntry = {
  user: User;
  cachedAtMs: number;
};

type UserWithVenueCacheEntry = {
  userWithVenue: UserWithVenue;
  cachedAtMs: number;
};

type CacheStores = {
  tokenByHash: Map<string, TokenCacheEntry>;
  userByUid: Map<string, UserCacheEntry>;
  userWithVenueByUid: Map<string, UserWithVenueCacheEntry>;
};

function getCacheTtlMs(): number {
  const rawValue = Number(process.env.AUTH_CONTEXT_CACHE_TTL_SECONDS || DEFAULT_CACHE_TTL_SECONDS);
  if (!Number.isFinite(rawValue)) return DEFAULT_CACHE_TTL_SECONDS * 1000;
  const boundedSeconds = Math.min(MAX_CACHE_TTL_SECONDS, Math.max(MIN_CACHE_TTL_SECONDS, Math.floor(rawValue)));
  return boundedSeconds * 1000;
}

function getStores(): CacheStores {
  const globalScope = globalThis as typeof globalThis & {
    __tbAuthContextCacheStores?: CacheStores;
  };

  if (!globalScope.__tbAuthContextCacheStores) {
    globalScope.__tbAuthContextCacheStores = {
      tokenByHash: new Map<string, TokenCacheEntry>(),
      userByUid: new Map<string, UserCacheEntry>(),
      userWithVenueByUid: new Map<string, UserWithVenueCacheEntry>(),
    };
  }

  return globalScope.__tbAuthContextCacheStores;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getTokenExpiryMs(decodedToken: DecodedIdToken): number {
  return (decodedToken.exp || 0) * 1000;
}

function isFresh(cachedAtMs: number, nowMs: number, ttlMs: number): boolean {
  return nowMs - cachedAtMs < ttlMs;
}

function isTokenUsable(entry: TokenCacheEntry, nowMs: number, ttlMs: number): boolean {
  if (!isFresh(entry.cachedAtMs, nowMs, ttlMs)) return false;
  return nowMs < entry.tokenExpiresAtMs;
}

function clearStaleEntries(nowMs: number, ttlMs: number) {
  const stores = getStores();

  stores.tokenByHash.forEach((entry, key) => {
    if (!isTokenUsable(entry, nowMs, ttlMs)) {
      stores.tokenByHash.delete(key);
    }
  });

  stores.userByUid.forEach((entry, key) => {
    if (!isFresh(entry.cachedAtMs, nowMs, ttlMs)) {
      stores.userByUid.delete(key);
    }
  });

  stores.userWithVenueByUid.forEach((entry, key) => {
    if (!isFresh(entry.cachedAtMs, nowMs, ttlMs)) {
      stores.userWithVenueByUid.delete(key);
    }
  });
}

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim() || null;
}

async function getVerifiedUidFromToken(token: string): Promise<string> {
  const nowMs = Date.now();
  const ttlMs = getCacheTtlMs();
  clearStaleEntries(nowMs, ttlMs);

  const tokenKey = hashToken(token);
  const stores = getStores();
  const existing = stores.tokenByHash.get(tokenKey);

  if (existing && isTokenUsable(existing, nowMs, ttlMs)) {
    return existing.uid;
  }

  const decoded = await auth.verifyIdToken(token);
  const entry: TokenCacheEntry = {
    uid: decoded.uid,
    tokenExpiresAtMs: getTokenExpiryMs(decoded),
    cachedAtMs: nowMs,
  };
  stores.tokenByHash.set(tokenKey, entry);
  return decoded.uid;
}

export async function resolveCachedFirebaseUidFromBearerToken(token: string): Promise<string> {
  return getVerifiedUidFromToken(token);
}

export async function resolveCachedUserFromBearerToken(token: string): Promise<User | null> {
  const uid = await getVerifiedUidFromToken(token);
  const nowMs = Date.now();
  const ttlMs = getCacheTtlMs();
  const stores = getStores();
  const existing = stores.userByUid.get(uid);

  if (existing && isFresh(existing.cachedAtMs, nowMs, ttlMs)) {
    return existing.user;
  }

  const user = await getUserByFirebaseUid(uid);
  if (!user) {
    stores.userByUid.delete(uid);
    return null;
  }

  stores.userByUid.set(uid, {
    user,
    cachedAtMs: nowMs,
  });

  return user;
}

export async function resolveCachedUserWithVenueFromBearerToken(
  token: string
): Promise<UserWithVenue | null> {
  const uid = await getVerifiedUidFromToken(token);
  const nowMs = Date.now();
  const ttlMs = getCacheTtlMs();
  const stores = getStores();
  const existing = stores.userWithVenueByUid.get(uid);

  if (existing && isFresh(existing.cachedAtMs, nowMs, ttlMs)) {
    return existing.userWithVenue;
  }

  const userWithVenue = await getUserWithVenue(uid);
  if (!userWithVenue) {
    stores.userWithVenueByUid.delete(uid);
    return null;
  }

  stores.userWithVenueByUid.set(uid, {
    userWithVenue,
    cachedAtMs: nowMs,
  });

  return userWithVenue;
}

