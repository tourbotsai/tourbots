import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, resolveCachedUserFromBearerToken } from '@/lib/server-auth-context';

export async function requirePlatformAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
  }

  try {
    const user = await resolveCachedUserFromBearerToken(token);

    if (!user || user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null;
  } catch (error) {
    console.error('Platform admin auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}
