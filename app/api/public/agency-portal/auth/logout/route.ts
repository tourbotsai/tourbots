import { NextRequest, NextResponse } from 'next/server';
import { clearAgencyAuthCookies, hashToken, AGENCY_SESSION_COOKIE } from '@/lib/agency-portal-auth';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

export async function POST(request: NextRequest) {
  try {
    const rawSessionToken = request.cookies.get(AGENCY_SESSION_COOKIE)?.value;
    if (rawSessionToken) {
      await supabase
        .from('agency_portal_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('session_token_hash', hashToken(rawSessionToken))
        .is('revoked_at', null);
    }

    const response = NextResponse.json({ success: true });
    clearAgencyAuthCookies(response);
    return response;
  } catch (error: any) {
    console.error('Agency portal logout error:', error);
    const response = NextResponse.json({ error: error?.message || 'Logout failed.' }, { status: 500 });
    clearAgencyAuthCookies(response);
    return response;
  }
}

