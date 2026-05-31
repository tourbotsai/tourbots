import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { ensureVenueBillingRecord, getVenueBillingOverview } from '@/lib/server/venue-billing-overview';

initAdmin();
const auth = getAuth();

const updateBillingSchema = z.object({
  action: z.enum(['select_plan']),
  planCode: z.string().min(1),
});

async function authenticateAndGetVenue(request: NextRequest): Promise<{ userId: string; venueId: string } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorisation header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userWithVenue = await getUserWithVenue(decodedToken.uid);

    if (!userWithVenue) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userWithVenue.venue_id) {
      return NextResponse.json({ error: 'User not associated with a venue' }, { status: 403 });
    }

    return { userId: userWithVenue.id, venueId: userWithVenue.venue_id };
  } catch (error) {
    console.error('Billing auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;

    const overview = await getVenueBillingOverview(venueId);

    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('Error fetching app billing data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId, venueId } = authResult;
    const body = await request.json();
    const parsed = updateBillingSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const { planCode } = parsed.data;

    if (!['free', 'pro'].includes(planCode)) {
      return NextResponse.json(
        { error: 'Only free and pro are selectable from app billing.' },
        { status: 400 }
      );
    }

    await ensureVenueBillingRecord(venueId);

    const billingStatus = planCode === 'free' ? 'free' : 'active';

    const { data: updatedRecord, error: updateError } = await supabase
      .from('venue_billing_records')
      .update({
        plan_code: planCode,
        billing_status: billingStatus,
      })
      .eq('venue_id', venueId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    await supabase
      .from('venue_billing_events')
      .insert({
        venue_id: venueId,
        event_type: 'plan_changed_by_user',
        event_source: 'app',
        event_payload: {
          plan_code: planCode,
          changed_by_user_id: userId,
        },
      });

    return NextResponse.json({
      success: true,
      billingRecord: updatedRecord,
    });
  } catch (error: any) {
    console.error('Error updating app billing data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update billing data' },
      { status: 500 }
    );
  }
}
