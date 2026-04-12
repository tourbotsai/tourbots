import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import {
  generateToken,
  hashToken,
  setAgencyAuthCookies,
  validatePortalVenueAccess,
  verifyStoredPassword,
} from '@/lib/agency-portal-auth';

const loginSchema = z.object({
  shareSlug: z.string().trim().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RETRY_AFTER_SECONDS = RATE_LIMIT_WINDOW_MINUTES * 60;

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip');
}

function getWindowStartIso(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

async function countFailedAttemptsForIdentity(shareSlug: string, email: string, windowStartIso: string) {
  const { count, error } = await supabase
    .from('agency_portal_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('share_slug', shareSlug)
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', windowStartIso);

  if (error) {
    console.error('Failed to count identity login attempts:', error);
    return 0;
  }
  return count || 0;
}

async function countFailedAttemptsForIp(ipAddress: string, windowStartIso: string) {
  const { count, error } = await supabase
    .from('agency_portal_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .eq('success', false)
    .gte('attempted_at', windowStartIso);

  if (error) {
    console.error('Failed to count IP login attempts:', error);
    return 0;
  }
  return count || 0;
}

async function recordLoginAttempt(params: {
  shareSlug: string;
  email: string;
  ipAddress: string | null;
  success: boolean;
}) {
  const { error } = await supabase.from('agency_portal_login_attempts').insert({
    share_slug: params.shareSlug,
    email: params.email,
    ip_address: params.ipAddress,
    success: params.success,
    attempted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to record agency login attempt:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid login payload.' }, { status: 400 });
    }

    const shareSlug = parsed.data.shareSlug.trim().toLowerCase();
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;
    const ipAddress = getClientIp(request);
    const windowStartIso = getWindowStartIso(RATE_LIMIT_WINDOW_MINUTES);

    const [identityFailures, ipFailures] = await Promise.all([
      countFailedAttemptsForIdentity(shareSlug, email, windowStartIso),
      ipAddress ? countFailedAttemptsForIp(ipAddress, windowStartIso) : Promise.resolve(0),
    ]);
    if (identityFailures >= MAX_FAILED_ATTEMPTS || ipFailures >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(RETRY_AFTER_SECONDS),
          },
        }
      );
    }

    const { data: share, error: shareError } = await supabase
      .from('agency_portal_shares')
      .select('id, venue_id, share_slug, is_active, enabled_modules')
      .eq('share_slug', shareSlug)
      .maybeSingle();

    if (shareError || !share || !share.is_active) {
      await recordLoginAttempt({ shareSlug, email, ipAddress, success: false });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const accessError = await validatePortalVenueAccess(request, share.venue_id);
    if (accessError) return accessError;

    const { data: user, error: userError } = await supabase
      .from('agency_portal_users')
      .select('id, email, password_hash, display_name, is_active, must_reset_password')
      .eq('share_id', share.id)
      .eq('venue_id', share.venue_id)
      .ilike('email', email)
      .maybeSingle();

    if (userError || !user || !user.is_active) {
      await recordLoginAttempt({ shareSlug, email, ipAddress, success: false });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordOk = verifyStoredPassword(password, user.password_hash);
    if (!passwordOk) {
      await recordLoginAttempt({ shareSlug, email, ipAddress, success: false });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const sessionToken = generateToken();
    const csrfToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from('agency_portal_sessions').insert({
      share_id: share.id,
      user_id: user.id,
      venue_id: share.venue_id,
      session_token_hash: hashToken(sessionToken),
      csrf_token_hash: hashToken(csrfToken),
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent'),
      expires_at: expiresAt,
      last_seen_at: new Date().toISOString(),
    });

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    await supabase
      .from('agency_portal_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
    await recordLoginAttempt({ shareSlug, email, ipAddress, success: true });

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        mustResetPassword: Boolean(user.must_reset_password),
      },
      share: {
        id: share.id,
        shareSlug: share.share_slug,
        enabledModules: share.enabled_modules || {},
      },
    });

    setAgencyAuthCookies(response, sessionToken, csrfToken);
    return response;
  } catch (error: any) {
    console.error('Agency portal login error:', error);
    return NextResponse.json({ error: error?.message || 'Login failed.' }, { status: 500 });
  }
}

