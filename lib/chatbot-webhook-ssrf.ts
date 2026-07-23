import { lookup } from 'dns/promises';
import { isIP } from 'net';

export interface SafeWebhookAddress {
  address: string;
  family: 4 | 6;
}

export interface SafeWebhookTarget {
  url: URL;
  hostname: string;
  addresses: SafeWebhookAddress[];
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return -1;
  }
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isIpv4InRange(ip: number, network: number, mask: number): boolean {
  return ((ip & mask) >>> 0) === (network >>> 0);
}

function ipv6ToBigInt(ip: string): bigint | null {
  const [address, embeddedIpv4] = ip.toLowerCase().split(/(?::)(?=\d+\.\d+\.\d+\.\d+$)/);
  const ipv4Parts = embeddedIpv4 ? embeddedIpv4.split('.').map(Number) : [];
  if (embeddedIpv4 && (ipv4Parts.length !== 4 || ipv4Parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))) {
    return null;
  }

  const ipv4Segments = embeddedIpv4
    ? [
        ((ipv4Parts[0] << 8) | ipv4Parts[1]).toString(16),
        ((ipv4Parts[2] << 8) | ipv4Parts[3]).toString(16),
      ]
    : [];
  const segments = address.split('::');
  if (segments.length > 2) return null;

  const left = segments[0] ? segments[0].split(':') : [];
  const right = segments.length === 2 && segments[1] ? segments[1].split(':') : [];
  const totalSegments = left.length + right.length + ipv4Segments.length;
  if (totalSegments > 8 || (segments.length === 1 && totalSegments !== 8)) return null;

  const expanded = [
    ...left,
    ...Array(8 - totalSegments).fill('0'),
    ...right,
    ...ipv4Segments,
  ];
  if (expanded.length !== 8 || expanded.some((segment) => !/^[\da-f]{1,4}$/.test(segment))) {
    return null;
  }

  return expanded.reduce(
    (value, segment) => (value << BigInt(16)) + BigInt(parseInt(segment, 16)),
    BigInt(0)
  );
}

function isIpv6InRange(ip: string, network: string, prefixLength: number): boolean {
  const value = ipv6ToBigInt(ip);
  const networkValue = ipv6ToBigInt(network);
  if (value === null || networkValue === null) return true;
  const shift = BigInt(128 - prefixLength);
  return (value >> shift) === (networkValue >> shift);
}

function getIpv4MappedIpv6Address(ip: string): string | null {
  const value = ipv6ToBigInt(ip);
  if (value === null || (value >> BigInt(32)) !== BigInt(0xffff)) return null;

  const ipv4 = Number(value & BigInt(0xffffffff));
  return [
    (ipv4 >>> 24) & 0xff,
    (ipv4 >>> 16) & 0xff,
    (ipv4 >>> 8) & 0xff,
    ipv4 & 0xff,
  ].join('.');
}

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const n = ipv4ToInt(ip);
    if (n < 0) return true;
    // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16
    if (isIpv4InRange(n, 0x00000000, 0xff000000)) return true;
    if (isIpv4InRange(n, 0x0a000000, 0xff000000)) return true;
    if (isIpv4InRange(n, 0x7f000000, 0xff000000)) return true;
    if (isIpv4InRange(n, 0xa9fe0000, 0xffff0000)) return true;
    if (isIpv4InRange(n, 0xac100000, 0xfff00000)) return true;
    if (isIpv4InRange(n, 0xc0a80000, 0xffff0000)) return true;
    // IANA special-use ranges: protocol assignment, documentation, benchmarking, multicast, and reserved.
    if (isIpv4InRange(n, 0xc0000000, 0xffffff00)) return true;
    if (isIpv4InRange(n, 0xc0000200, 0xffffff00)) return true;
    if (isIpv4InRange(n, 0xc6120000, 0xfffe0000)) return true;
    if (isIpv4InRange(n, 0xc6336400, 0xffffff00)) return true;
    if (isIpv4InRange(n, 0xcb007100, 0xffffff00)) return true;
    if (isIpv4InRange(n, 0xe0000000, 0xf0000000)) return true;
    // 100.64.0.0/10 (CGNAT)
    if (isIpv4InRange(n, 0x64400000, 0xffc00000)) return true;
    return false;
  }

  if (version === 6) {
    const normalised = ip.toLowerCase();
    const mappedIpv4 = getIpv4MappedIpv6Address(normalised);
    if (mappedIpv4 && isPrivateOrReservedIp(mappedIpv4)) return true;
    if (isIpv6InRange(normalised, '::', 96)) return true; // unspecified, loopback, and IPv4-compatible
    if (isIpv6InRange(normalised, 'fc00::', 7)) return true; // ULA
    if (isIpv6InRange(normalised, 'fe80::', 10)) return true; // link-local
    if (isIpv6InRange(normalised, 'ff00::', 8)) return true; // multicast
    if (isIpv6InRange(normalised, '2001:db8::', 32)) return true; // documentation
    if (isIpv6InRange(normalised, '2002::', 16)) return true; // 6to4 can embed private IPv4
    return false;
  }

  return true;
}

/**
 * Resolve a customer webhook URL once and return only public addresses. The
 * returned addresses must be used by the HTTP client to prevent DNS rebinding.
 */
export async function resolveSafeWebhookTarget(rawUrl: string): Promise<SafeWebhookTarget> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Webhook URL must use HTTPS');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Webhook URL must not include credentials');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    throw new Error('Webhook URL host is not allowed');
  }

  if (hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1') {
    throw new Error('Webhook URL host is not allowed');
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Webhook URL must not target a private IP address');
    }
    return {
      url: parsed,
      hostname,
      addresses: [{ address: hostname, family: isIP(hostname) as 4 | 6 }],
    };
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Webhook URL host could not be resolved');
  }

  if (!addresses.length) {
    throw new Error('Webhook URL host could not be resolved');
  }

  for (const entry of addresses) {
    if (isPrivateOrReservedIp(entry.address)) {
      throw new Error('Webhook URL resolves to a private or reserved IP address');
    }
  }

  return {
    url: parsed,
    hostname,
    addresses: addresses.map((entry) => ({
      address: entry.address,
      family: entry.family as 4 | 6,
    })),
  };
}

/**
 * Save-time validation for configuration routes. Delivery-time callers must
 * use resolveSafeWebhookTarget so their connection is DNS-pinned.
 */
export async function assertSafeWebhookUrl(rawUrl: string): Promise<URL> {
  return (await resolveSafeWebhookTarget(rawUrl)).url;
}
