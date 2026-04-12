import { NextRequest, NextResponse } from 'next/server';

const REQUEST_ID_HEADER = 'x-request-id';
const DISALLOWED_METHODS = new Set(['TRACE', 'CONNECT']);
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_PUBLIC_HEADERS = [
  'Content-Type',
  'Accept',
  'Origin',
  'X-Requested-With',
  'X-Request-Id',
];

const SUSPICIOUS_USER_AGENT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /nessus/i,
  /metasploit/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
];

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  pathPrefix: string;
  methods: string[];
  limit: number;
  windowMs: number;
};

type PublicCorsRule = {
  pattern: RegExp;
  methods: string[];
  allowedHeaders: string[];
  allowWildcardOrigin?: boolean;
};

const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    pathPrefix: '/api/public/agency-portal/auth/login',
    methods: ['POST'],
    limit: 25,
    windowMs: 5 * 60 * 1000,
  },
  {
    pathPrefix: '/api/public/tour-chatbot/',
    methods: ['POST'],
    limit: 120,
    windowMs: 60 * 1000,
  },
  {
    pathPrefix: '/api/public/contact',
    methods: ['POST'],
    limit: 30,
    windowMs: 60 * 1000,
  },
  {
    pathPrefix: '/api/public/sales-contact',
    methods: ['POST'],
    limit: 30,
    windowMs: 60 * 1000,
  },
  {
    pathPrefix: '/api/public/book-tour',
    methods: ['POST'],
    limit: 30,
    windowMs: 60 * 1000,
  },
];

const ROUTE_METHOD_ALLOWLIST: Array<{ pattern: RegExp; methods: Set<string> }> = [
  {
    pattern: /^\/api\/auth\/check-user$/,
    methods: new Set(['POST', 'OPTIONS']),
  },
  {
    pattern: /^\/api\/webhooks\/stripe$/,
    methods: new Set(['POST', 'OPTIONS']),
  },
];

const PUBLIC_CORS_RULES: PublicCorsRule[] = [
  {
    pattern: /^\/api\/public\/tour-chatbot\/[^/]+$/,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/chatbot-config\/[^/]+$/,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/tours\/[^/]+$/,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/embed\/track$/,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/embed\/track-pixel$/,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/ebooks$/,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS],
    allowWildcardOrigin: true,
  },
  {
    pattern: /^\/api\/public\/agency-portal\/.+/,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [...DEFAULT_PUBLIC_HEADERS, 'Authorization', 'X-CSRF-Token'],
    allowWildcardOrigin: false,
  },
];

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

function getAllowedPublicOrigins(): Set<string> {
  const values = new Set<string>([
    'https://tourbots.ai',
    'https://www.tourbots.ai',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  const envOrigins = process.env.PUBLIC_API_ALLOWED_ORIGINS;
  if (envOrigins) {
    envOrigins
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((origin) => values.add(origin));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (baseUrl) values.add(baseUrl);

  return values;
}

function isAllowedOrigin(origin: string, allowedOrigins: Set<string>): boolean {
  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname.endsWith('.tourbots.ai');
  } catch {
    return false;
  }
}

function shouldApplyPublicOriginValidation(pathname: string, method: string): boolean {
  return pathname.startsWith('/api/public/') && WRITE_METHODS.has(method);
}

function getPublicCorsRule(pathname: string): PublicCorsRule | null {
  return PUBLIC_CORS_RULES.find((rule) => rule.pattern.test(pathname)) || null;
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  return SUSPICIOUS_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function applyStandardResponseHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-dns-prefetch-control', 'off');
  response.headers.set('x-download-options', 'noopen');
  response.headers.set('x-permitted-cross-domain-policies', 'none');
  return response;
}

function withJsonError(
  requestId: string,
  status: number,
  error: string,
  extraHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    {
      error,
      requestId,
    },
    { status }
  );

  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return applyStandardResponseHeaders(response, requestId);
}

function applyPublicCorsHeaders(
  response: NextResponse,
  origin: string | null,
  allowedOrigins: Set<string>,
  corsRule: PublicCorsRule | null
): NextResponse {
  const isKnownCrossSiteEmbedApi = Boolean(corsRule?.allowWildcardOrigin);
  const allowOrigin = origin && isAllowedOrigin(origin, allowedOrigins)
    ? origin
    : isKnownCrossSiteEmbedApi
      ? '*'
      : 'https://tourbots.ai';

  response.headers.set('access-control-allow-origin', allowOrigin);
  response.headers.set(
    'access-control-allow-methods',
    (corsRule?.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']).join(',')
  );
  response.headers.set(
    'access-control-allow-headers',
    (corsRule?.allowedHeaders || [...DEFAULT_PUBLIC_HEADERS, 'Authorization', 'X-CSRF-Token']).join(', ')
  );
  response.headers.set('access-control-max-age', '86400');
  response.headers.set('vary', 'Origin');
  return response;
}

function enforceRouteMethodAllowlist(pathname: string, method: string): string | null {
  const matchedRule = ROUTE_METHOD_ALLOWLIST.find((rule) => rule.pattern.test(pathname));
  if (!matchedRule) return null;
  if (matchedRule.methods.has(method)) return null;
  return `Method ${method} not allowed for this endpoint`;
}

function getRateLimitStore(): Map<string, RateLimitEntry> {
  const globalScope = globalThis as typeof globalThis & {
    __tbRateLimitStore?: Map<string, RateLimitEntry>;
  };

  if (!globalScope.__tbRateLimitStore) {
    globalScope.__tbRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalScope.__tbRateLimitStore;
}

function enforceRateLimit(
  request: NextRequest,
  pathname: string,
  method: string
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const rule = RATE_LIMIT_RULES.find(
    (candidate) =>
      pathname.startsWith(candidate.pathPrefix) && candidate.methods.includes(method)
  );

  if (!rule) return { allowed: true };

  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${rule.pathPrefix}:${method}:${ip}`;
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true };
  }

  if (existing.count >= rule.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  store.set(key, existing);
  return { allowed: true };
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();
  const requestId = request.headers.get(REQUEST_ID_HEADER) || crypto.randomUUID();
  const allowedOrigins = getAllowedPublicOrigins();
  const publicCorsRule = pathname.startsWith('/api/public/') ? getPublicCorsRule(pathname) : null;

  if (DISALLOWED_METHODS.has(method)) {
    return withJsonError(requestId, 405, `Method ${method} not allowed`);
  }

  const methodError = enforceRouteMethodAllowlist(pathname, method);
  if (methodError) {
    return withJsonError(requestId, 405, methodError, {
      allow: 'OPTIONS, POST',
    });
  }

  const origin = request.headers.get('origin');

  if (pathname.startsWith('/api/public/') && publicCorsRule && !publicCorsRule.methods.includes(method)) {
    return withJsonError(requestId, 405, `Method ${method} not allowed for this endpoint`, {
      allow: publicCorsRule.methods.join(', '),
    });
  }

  if (pathname.startsWith('/api/public/') && method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    applyStandardResponseHeaders(response, requestId);
    return applyPublicCorsHeaders(response, origin, allowedOrigins, publicCorsRule);
  }

  if (shouldApplyPublicOriginValidation(pathname, method)) {
    if (!origin) {
      return withJsonError(requestId, 403, 'Origin header required');
    }
    if (!isAllowedOrigin(origin, allowedOrigins)) {
      return withJsonError(requestId, 403, 'Origin not allowed');
    }
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (pathname.startsWith('/api/public/') && WRITE_METHODS.has(method) && isSuspiciousUserAgent(userAgent)) {
    return withJsonError(requestId, 403, 'Request blocked');
  }

  const rateLimit = enforceRateLimit(request, pathname, method);
  if (!rateLimit.allowed) {
    return withJsonError(requestId, 429, 'Too many requests', {
      'retry-after': String(rateLimit.retryAfterSeconds),
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applyStandardResponseHeaders(response, requestId);
  if (pathname.startsWith('/api/public/')) {
    applyPublicCorsHeaders(response, origin, allowedOrigins, publicCorsRule);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
