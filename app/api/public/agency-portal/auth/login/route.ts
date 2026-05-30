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

const loginSchema = z
  .object({
    // Per-client embed login is scoped to a share slug. The universal agency
    // portal embed instead passes the agency (venue) id and we resolve the
    // matching client by email across that agency's active shares.
    shareSlug: z.string().trim().min(3).max(120).optional(),
    agencyId: z.string().uuid().optional(),
    email: z.string().email(),
    password: z.string().min(8).max(200),
  })
  .refine((data) => Boolean(data.shareSlug) !== Boolean(data.agencyId), {
    message: 'Provide either a share slug or an agency id.',
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

    const agencyId = parsed.data.agencyId;
    const shareSlug = parsed.data.shareSlug?.trim().toLowerCase();
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;
    const ipAddress = getClientIp(request);
    const windowStartIso = getWindowStartIso(RATE_LIMIT_WINDOW_MINUTES);

    // Rate-limit key: per-client login keys on the slug, universal agency login
    // keys on the agency id (since the slug is only known after resolution).
    const rateKey = shareSlug ? shareSlug : `agency:${agencyId}`;

    const [identityFailures, ipFailures] = await Promise.all([
      countFailedAttemptsForIdentity(rateKey, email, windowStartIso),
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

    let share: { id: string; venue_id: string; share_slug: string; is_active: boolean; enabled_modules: any; tour_id: string | null } | null = null;
    let user: { id: string; email: string; password_hash: string; display_name: string | null; is_active: boolean; must_reset_password: boolean } | null = null;

    if (agencyId) {
      // Universal agency portal: resolve the client by email across the agency's
      // active users. Email is unique per agency, so there is at most one match.
      const { data: users, error: usersError } = await supabase
        .from('agency_portal_users')
        .select('id, email, password_hash, display_name, is_active, must_reset_password, share_id')
        .eq('venue_id', agencyId)
        .eq('is_active', true)
        .ilike('email', email)
        .limit(2);

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }

      const matches = users || [];
      if (matches.length > 1) {
        return NextResponse.json(
          { error: 'This account needs attention. Please contact your agency.' },
          { status: 409 }
        );
      }

      const candidate = matches[0];
      if (candidate) {
        const { data: shareRow } = await supabase
          .from('agency_portal_shares')
          .select('id, venue_id, share_slug, is_active, enabled_modules, tour_id')
          .eq('id', candidate.share_id)
          .eq('venue_id', agencyId)
          .maybeSingle();
        if (shareRow && shareRow.is_active) {
          share = shareRow;
          user = candidate;
        }
      }

      const accessError = await validatePortalVenueAccess(request, agencyId);
      if (accessError) return accessError;
    } else {
      const { data: shareRow, error: shareError } = await supabase
        .from('agency_portal_shares')
        .select('id, venue_id, share_slug, is_active, enabled_modules, tour_id')
        .eq('share_slug', shareSlug!)
        .maybeSingle();

      if (shareError || !shareRow || !shareRow.is_active) {
        await recordLoginAttempt({ shareSlug: rateKey, email, ipAddress, success: false });
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      share = shareRow;

      const accessError = await validatePortalVenueAccess(request, share.venue_id);
      if (accessError) return accessError;

      const { data: userRow, error: userError } = await supabase
        .from('agency_portal_users')
        .select('id, email, password_hash, display_name, is_active, must_reset_password')
        .eq('share_id', share.id)
        .eq('venue_id', share.venue_id)
        .ilike('email', email)
        .maybeSingle();

      if (userError || !userRow || !userRow.is_active) {
        await recordLoginAttempt({ shareSlug: rateKey, email, ipAddress, success: false });
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      user = userRow;
    }

    if (!share || !user) {
      await recordLoginAttempt({ shareSlug: rateKey, email, ipAddress, success: false });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordOk = verifyStoredPassword(password, user.password_hash);
    if (!passwordOk) {
      await recordLoginAttempt({ shareSlug: rateKey, email, ipAddress, success: false });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const { data: tourRow } = await supabase
      .from('tours')
      .select('title')
      .eq('id', share.tour_id)
      .maybeSingle();
    const tourTitle = tourRow?.title || 'Tour';

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
    await recordLoginAttempt({ shareSlug: rateKey, email, ipAddress, success: true });

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
        tourId: share.tour_id,
        tourTitle,
      },
    });

    setAgencyAuthCookies(response, sessionToken, csrfToken);
    return response;
  } catch (error: any) {
    console.error('Agency portal login error:', error);
    return NextResponse.json({ error: error?.message || 'Login failed.' }, { status: 500 });
  }
}

