import { NextRequest, NextResponse } from 'next/server';
import { lookupUserByEmail } from '@/lib/services/multi-venue-access-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'email parameter is required' },
        { status: 400 }
      );
    }

    const result = await lookupUserByEmail(email);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error looking up user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup user' },
      { status: 500 }
    );
  }
}
