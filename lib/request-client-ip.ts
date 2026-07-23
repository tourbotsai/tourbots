type RequestWithHeaders = {
  headers: Headers;
};

function normaliseIpv4(value: string): string | null {
  const octets = value.split('.');
  if (octets.length !== 4) return null;

  const normalised = octets.map((octet) => {
    if (!/^\d{1,3}$/.test(octet)) return null;
    const number = Number(octet);
    if (number > 255) return null;
    return String(number);
  });

  return normalised.every((octet): octet is string => octet !== null)
    ? normalised.join('.')
    : null;
}

function normaliseIpv6(value: string): string | null {
  const lowerCaseValue = value.toLowerCase();
  const doubleColonIndex = lowerCaseValue.indexOf('::');
  if (doubleColonIndex !== -1 && lowerCaseValue.indexOf('::', doubleColonIndex + 2) !== -1) {
    return null;
  }

  const parseParts = (parts: string[]): string[] | null => {
    const parsed: string[] = [];
    for (const part of parts) {
      if (!part) return null;
      if (part.includes('.')) {
        const ipv4 = normaliseIpv4(part);
        if (!ipv4) return null;
        const [first, second, third, fourth] = ipv4.split('.').map(Number);
        parsed.push(
          ((first << 8) | second).toString(16),
          ((third << 8) | fourth).toString(16)
        );
        continue;
      }
      if (!/^[\da-f]{1,4}$/.test(part)) return null;
      parsed.push(parseInt(part, 16).toString(16));
    }
    return parsed;
  };

  const [leftRaw, rightRaw] = lowerCaseValue.split('::');
  const left = parseParts(leftRaw ? leftRaw.split(':') : []);
  const right = parseParts(rightRaw ? rightRaw.split(':') : []);
  if (!left || !right) return null;

  const usesCompression = doubleColonIndex !== -1;
  const missingParts = 8 - left.length - right.length;
  if ((!usesCompression && missingParts !== 0) || (usesCompression && missingParts < 1)) {
    return null;
  }

  const parts = usesCompression
    ? [...left, ...Array(missingParts).fill('0'), ...right]
    : [...left, ...right];

  if (parts.length !== 8) return null;

  let longestStart = -1;
  let longestLength = 0;
  for (let index = 0; index < parts.length;) {
    if (parts[index] !== '0') {
      index += 1;
      continue;
    }
    const start = index;
    while (index < parts.length && parts[index] === '0') index += 1;
    if (index - start > longestLength) {
      longestStart = start;
      longestLength = index - start;
    }
  }

  if (longestLength < 2) return parts.join(':');
  const before = parts.slice(0, longestStart).join(':');
  const after = parts.slice(longestStart + longestLength).join(':');
  return before && after ? `${before}::${after}` : before ? `${before}::` : `::${after}`;
}

export function normaliseIpAddress(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return null;
  const unwrapped = trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.slice(1, -1)
    : trimmed;

  return normaliseIpv4(unwrapped) || normaliseIpv6(unwrapped);
}

function resolveTrustedHeader(value: string | null): string | null {
  if (!value) return null;

  for (const candidate of value.split(',')) {
    const ipAddress = normaliseIpAddress(candidate);
    if (ipAddress) return ipAddress;
  }
  return null;
}

/**
 * Resolves a client IP from headers set by trusted infrastructure only.
 * Generic forwarding and request-metadata headers are intentionally ignored.
 */
export function getClientIp(request: RequestWithHeaders): string {
  return (
    resolveTrustedHeader(request.headers.get('x-vercel-forwarded-for')) ||
    resolveTrustedHeader(request.headers.get('x-real-ip')) ||
    (process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'unknown')
  );
}
