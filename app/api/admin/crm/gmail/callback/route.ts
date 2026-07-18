import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
  saveCrmGmailAccount,
  verifyOAuthState,
} from '@/lib/services/admin/crm-gmail-service';

export const dynamic = 'force-dynamic';

// Google redirects the admin's browser here as a plain top-level navigation —
// there's no bearer token available on this request. Instead we trust the
// HMAC-signed `state` param, which only /connect (itself behind
// requirePlatformAdmin) could have produced. See crm-gmail-service.ts.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectBase = '/admin/crm';

  const oauthError = searchParams.get('error');
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?gmail_error=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state || !verifyOAuthState(state)) {
    return NextResponse.redirect(new URL(`${redirectBase}?gmail_error=invalid_state`, request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Happens if the admin previously connected without revoking access first,
      // so Google skipped issuing a new refresh token — prompt=consent should
      // normally prevent this, but guard against it anyway.
      return NextResponse.redirect(
        new URL(`${redirectBase}?gmail_error=no_refresh_token`, request.url)
      );
    }

    const emailAddress = await fetchGoogleUserEmail(tokens.access_token);

    await saveCrmGmailAccount({
      emailAddress,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    });

    return NextResponse.redirect(
      new URL(`${redirectBase}?gmail_connected=${encodeURIComponent(emailAddress)}`, request.url)
    );
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/gmail/callback:', error);
    return NextResponse.redirect(
      new URL(`${redirectBase}?gmail_error=${encodeURIComponent(error.message || 'connection_failed')}`, request.url)
    );
  }
}
