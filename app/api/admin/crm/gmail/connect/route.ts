import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
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

    const state = signOAuthState({ exp: Date.now() + 10 * 60 * 1000 });
    // No login_hint: the account being connected here is a Workspace mailbox
    // (e.g. jack@tourbotsai.com), which is unrelated to whatever email the
    // admin used to log into the CRM itself — passing the wrong hint can
    // confuse Google's account chooser and trigger a spurious org_internal
    // error even when the correct account is selected manually.
    const url = getGoogleOAuthConsentUrl(state);

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/gmail/connect:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start Gmail connection' },
      { status: 500 }
    );
  }
}
