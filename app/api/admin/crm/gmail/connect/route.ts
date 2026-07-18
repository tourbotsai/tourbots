import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { extractBearerToken, resolveCachedUserFromBearerToken } from '@/lib/server-auth-context';
import { getGoogleOAuthConsentUrl, signOAuthState } from '@/lib/services/admin/crm-gmail-service';

export const dynamic = 'force-dynamic';

// Called from the authenticated admin UI (fetch with a bearer token) — returns
// the Google consent URL rather than redirecting directly, since the caller
// needs to do the actual top-level browser navigation itself. The state param
// is HMAC-signed so /callback can verify this request was legitimately
// started by an authenticated admin, without needing a bearer token itself
// (Google's redirect back to us is a plain navigation with no custom headers).
export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    let connectedBy: string | null = null;
    const token = extractBearerToken(request);
    if (token) {
      const user = await resolveCachedUserFromBearerToken(token);
      connectedBy = user?.email || null;
    }

    const state = signOAuthState({ exp: Date.now() + 10 * 60 * 1000 });
    const url = getGoogleOAuthConsentUrl(state, connectedBy);

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/gmail/connect:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Gmail connection' },
      { status: 500 }
    );
  }
}
