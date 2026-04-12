import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { initAdmin } from '@/lib/firebase-admin';
import { getUserWithVenue } from '@/lib/user-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

initAdmin();
const auth = getAuth();

const createTourSchema = z.object({
  venueId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  matterportTourId: z.string().min(1),
  matterportUrl: z.string().url(),
  thumbnailUrl: z.string().url().nullable().optional(),
  tourType: z.enum(['primary', 'secondary']).optional(),
  parentTourId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().min(1).optional(),
  navigationKeywords: z.array(z.string()).optional(),
});

async function authenticateAndGetVenue(request: NextRequest): Promise<{ venueId: string } | NextResponse> {
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

    return { venueId: userWithVenue.venue_id };
  } catch (error) {
    console.error('Tours auth error:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

async function getLocationSpaceLimit(venueId: string): Promise<number> {
  const { data: billingRecord } = await supabase
    .from('venue_billing_records')
    .select('*')
    .eq('venue_id', venueId)
    .maybeSingle();

  const planCode =
    billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
      ? billingRecord.override_plan_code
      : billingRecord?.plan_code || 'free';

  const { data: planRow } = await supabase
    .from('billing_plans')
    .select('included_spaces')
    .eq('code', planCode)
    .maybeSingle();

  const baseSpacesFromPlan = Number(planRow?.included_spaces || 0);
  const baseSpaces = Math.max(baseSpacesFromPlan, planCode === 'free' ? 1 : 0);
  const extraSpaces = Number(billingRecord?.addon_extra_spaces || 0);

  const totalSpaces = Number(
    billingRecord?.effective_space_limit ?? (baseSpaces + extraSpaces)
  );

  return Math.max(totalSpaces, 1);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const parsed = createTourSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const {
      venueId,
      title,
      description = null,
      matterportTourId,
      matterportUrl,
      thumbnailUrl = null,
      tourType = 'primary',
      parentTourId = null,
      displayOrder,
      navigationKeywords = [],
    } = parsed.data;

    if (authResult.venueId !== venueId) {
      return NextResponse.json({ error: 'Forbidden venue scope' }, { status: 403 });
    }

    if (tourType === 'primary') {
      const [spaceLimit, primaryCountResult] = await Promise.all([
        getLocationSpaceLimit(venueId),
        supabase
          .from('tours')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venueId)
          .eq('is_active', true)
          .or('tour_type.eq.primary,tour_type.is.null'),
      ]);

      if (primaryCountResult.error) {
        throw primaryCountResult.error;
      }

      const primaryCount = Number(primaryCountResult.count || 0);
      if (primaryCount >= spaceLimit) {
        return NextResponse.json(
          {
            error: `Location limit reached (${primaryCount}/${spaceLimit}). Upgrade your plan or purchase extra space add-ons to add another location.`,
          },
          { status: 403 }
        );
      }
    }

    if (tourType === 'secondary') {
      if (!parentTourId) {
        return NextResponse.json({ error: 'parentTourId is required for secondary tours' }, { status: 400 });
      }

      const { data: parentTour, error: parentError } = await supabase
        .from('tours')
        .select('id, venue_id')
        .eq('id', parentTourId)
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parentTour) {
        return NextResponse.json({ error: 'Parent location not found' }, { status: 404 });
      }
    }

    let resolvedDisplayOrder = displayOrder;
    if (!resolvedDisplayOrder) {
      const { data: lastTourByOrder, error: orderLookupError } = await supabase
        .from('tours')
        .select('display_order')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderLookupError) throw orderLookupError;
      resolvedDisplayOrder = (lastTourByOrder?.display_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('tours')
      .insert([
        {
          venue_id: venueId,
          parent_tour_id: tourType === 'secondary' ? parentTourId : null,
          title,
          description,
          matterport_tour_id: matterportTourId,
          matterport_url: matterportUrl,
          thumbnail_url: thumbnailUrl,
          tour_type: tourType,
          display_order: resolvedDisplayOrder,
          navigation_keywords: tourType === 'secondary' ? navigationKeywords : [],
          is_active: true,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating tour:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create tour' },
      { status: 500 }
    );
  }
}
