import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, scryptSync } from 'crypto';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue, getScopedVenueId } from '@/lib/authenticated-venue';
import { ENTITLEMENT_COLUMNS, venueHasAgencyPortal } from '@/lib/billing-entitlements';
import { getCurrentMessageCreditPeriod } from '@/lib/billing-period';

const enabledModulesSchema = z.object({
  tour: z.boolean().optional(),
  settings: z.boolean().optional(),
  customisation: z.boolean().optional(),
  analytics: z.boolean().optional(),
  share: z.boolean().optional(),
  tour_blocks: z
    .object({
      setup: z.boolean().optional(),
      menu: z.boolean().optional(),
    })
    .optional(),
  settings_blocks: z
    .object({
      config: z.boolean().optional(),
      information: z.boolean().optional(),
      documents: z.boolean().optional(),
      triggers: z.boolean().optional(),
    })
    .optional(),
});

const upsertShareSchema = z.object({
  action: z.literal('upsert_share'),
  shareId: z.string().uuid().optional(),
  tourId: z.string().uuid(),
  shareSlug: z.string().min(3).max(120),
  isActive: z.boolean().optional(),
  enabledModules: enabledModulesSchema.optional(),
  clientEmail: z.string().email().optional(),
  clientPassword: z.string().min(8).max(200).optional(),
  regeneratePassword: z.boolean().optional(),
});

const toggleShareSchema = z.object({
  action: z.literal('toggle_share'),
  shareId: z.string().uuid(),
  isActive: z.boolean(),
});

const createCredentialSchema = z.object({
  action: z.literal('regenerate_credentials'),
  shareId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8).max(200).optional(),
});

const saveAllocationsSchema = z.object({
  action: z.literal('save_allocations'),
  allocations: z
    .array(
      z.object({
        shareId: z.string().uuid(),
        allocation: z.number().int().min(0).max(10_000_000),
      })
    )
    .max(500),
});

const actionSchema = z.discriminatedUnion('action', [
  upsertShareSchema,
  toggleShareSchema,
  createCredentialSchema,
  saveAllocationsSchema,
]);

function normaliseSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function generateTemporaryPassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const bytes = randomBytes(length);
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += alphabet[bytes[i] % alphabet.length];
  }
  return value;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function getEntitlement(venueId: string): Promise<boolean> {
  const { data } = await supabase
    .from('venue_billing_records')
    .select(ENTITLEMENT_COLUMNS)
    .eq('venue_id', venueId)
    .maybeSingle();
  return venueHasAgencyPortal(data as any);
}

/**
 * Resolves the agency's monthly message pool: the venue-wide limit (plan
 * included_messages + add-ons, or an override) and the messages used so far in
 * the current calendar month. This is the budget that per-client allocations
 * must fit within.
 */
async function getAgencyPool(venueId: string): Promise<{ used: number; limit: number; resetAt: string }> {
  const { periodStart, resetAt } = getCurrentMessageCreditPeriod();

  const { data: billingRecord } = await supabase
    .from('venue_billing_records')
    .select('plan_code, billing_override_enabled, override_plan_code, addon_extra_spaces, addon_message_blocks, effective_message_limit')
    .eq('venue_id', venueId)
    .maybeSingle();

  const planCode = billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
    ? billingRecord.override_plan_code
    : (billingRecord?.plan_code || 'free');

  const { data: planRow } = await supabase
    .from('billing_plans')
    .select('included_messages')
    .eq('code', planCode)
    .maybeSingle();

  const baseMessages = Number(planRow?.included_messages || 0);
  const extraSpaces = Number(billingRecord?.addon_extra_spaces || 0);
  const messageBlocks = Number(billingRecord?.addon_message_blocks || 0);
  const limit = Number(
    billingRecord?.effective_message_limit ??
    (baseMessages + extraSpaces * 1000 + messageBlocks * 1000)
  );

  const { count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('chatbot_type', 'tour')
    .eq('message_type', 'visitor')
    .gte('created_at', periodStart);

  return { used: Number(count || 0), limit, resetAt };
}

/** Counts a single client tour's visitor messages in the current month. */
async function getTourMessagesThisMonth(venueId: string, tourId: string, periodStart: string): Promise<number> {
  const { count } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .eq('tour_id', tourId)
    .eq('chatbot_type', 'tour')
    .eq('message_type', 'visitor')
    .gte('created_at', periodStart);
  return Number(count || 0);
}

async function assertTourInVenue(venueId: string, tourId: string) {
  const { data } = await supabase
    .from('tours')
    .select('id')
    .eq('id', tourId)
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .maybeSingle();
  return Boolean(data);
}

async function upsertPortalUser(params: {
  shareId: string;
  venueId: string;
  email: string;
  displayName?: string;
  passwordHash?: string;
  updatePassword?: boolean;
  mustResetPassword?: boolean;
  createdByUserId: string;
}) {
  // Email must be unique within an agency so the universal portal login can
  // resolve a single client by email. Block the same email on another share.
  const venueDuplicate = await supabase
    .from('agency_portal_users')
    .select('id')
    .eq('venue_id', params.venueId)
    .eq('is_active', true)
    .neq('share_id', params.shareId)
    .ilike('email', params.email)
    .limit(1);

  if (venueDuplicate.error) {
    throw new Error(venueDuplicate.error.message);
  }
  if (venueDuplicate.data && venueDuplicate.data.length > 0) {
    throw new Error('This email is already in use for another client. Use a different email.');
  }

  const existingLookup = await supabase
    .from('agency_portal_users')
    .select('id')
    .eq('share_id', params.shareId)
    .eq('venue_id', params.venueId)
    .ilike('email', params.email)
    .maybeSingle();

  if (existingLookup.error) {
    throw new Error(existingLookup.error.message);
  }

  if (existingLookup.data?.id) {
    const updatePayload: Record<string, any> = {
      display_name: params.displayName || null,
      is_active: true,
    };
    if (params.updatePassword && params.passwordHash) {
      updatePayload.password_hash = params.passwordHash;
      updatePayload.must_reset_password = Boolean(params.mustResetPassword);
    }

    const updated = await supabase
      .from('agency_portal_users')
      .update(updatePayload)
      .eq('id', existingLookup.data.id)
      .select('id, email, display_name, is_active')
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }
    return { user: updated.data, created: false, passwordUpdated: Boolean(params.updatePassword && params.passwordHash) };
  }

  if (!params.passwordHash) {
    throw new Error('Password is required when creating a new client user.');
  }

  const inserted = await supabase
    .from('agency_portal_users')
    .insert({
      share_id: params.shareId,
      venue_id: params.venueId,
      email: params.email,
      display_name: params.displayName || null,
      password_hash: params.passwordHash,
      must_reset_password: Boolean(params.mustResetPassword),
      is_active: true,
      created_by_user_id: params.createdByUserId,
    })
    .select('id, email, display_name, is_active')
    .single();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return { user: inserted.data, created: true, passwordUpdated: true };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const requestedVenueId = new URL(request.url).searchParams.get('venueId');
    const scopedVenueId = getScopedVenueId(authResult, requestedVenueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;
    const venueId = scopedVenueId;
    const entitlementEnabled = await getEntitlement(venueId);

    const [{ data: tours, error: toursError }, { data: shares, error: sharesError }] = await Promise.all([
      supabase
        .from('tours')
        .select('id, title, tour_type, is_active, updated_at')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('agency_portal_shares')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false }),
    ]);

    if (toursError) {
      return NextResponse.json({ error: toursError.message }, { status: 500 });
    }
    if (sharesError) {
      return NextResponse.json({ error: sharesError.message }, { status: 500 });
    }

    const shareIds = (shares || []).map((share) => share.id);
    let usersByShareId: Record<string, Array<{ id: string; email: string; display_name: string | null; is_active: boolean; last_login_at: string | null }>> = {};

    if (shareIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('agency_portal_users')
        .select('id, share_id, email, display_name, is_active, last_login_at')
        .in('share_id', shareIds)
        .order('created_at', { ascending: false });

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }

      usersByShareId = (users || []).reduce((acc, user) => {
        const list = acc[user.share_id] || [];
        list.push({
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
        });
        acc[user.share_id] = list;
        return acc;
      }, {} as Record<string, Array<{ id: string; email: string; display_name: string | null; is_active: boolean; last_login_at: string | null }>>);
    }

    const pool = await getAgencyPool(venueId);
    const { periodStart } = getCurrentMessageCreditPeriod();

    // Per-client usage this month, keyed by share, for the allocation table.
    const usageByShareId: Record<string, number> = {};
    await Promise.all(
      (shares || []).map(async (share) => {
        usageByShareId[share.id] = share.tour_id
          ? await getTourMessagesThisMonth(venueId, share.tour_id, periodStart)
          : 0;
      })
    );

    return NextResponse.json({
      entitlement: { entitled: entitlementEnabled },
      tours: tours || [],
      pool,
      shares: (shares || []).map((share) => ({
        ...share,
        users: usersByShareId[share.id] || [],
        messages_used_this_month: usageByShareId[share.id] || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching agency portal shares:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch agency portal shares' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const body = await request.json();
    const scopedVenueId = getScopedVenueId(authResult, body?.venueId);
    if (scopedVenueId instanceof NextResponse) return scopedVenueId;
    const venueId = scopedVenueId;

    const entitlementEnabled = await getEntitlement(venueId);
    if (!entitlementEnabled) {
      return NextResponse.json(
        { error: 'Agency Portal add-on is required before creating shares.' },
        { status: 403 }
      );
    }

    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((entry) => entry.message).join(', ');
      return NextResponse.json({ error: `Invalid input: ${errorMessages}` }, { status: 400 });
    }

    const payload = parsed.data;

    if (payload.action === 'toggle_share') {
      const { data: updated, error } = await supabase
        .from('agency_portal_shares')
        .update({ is_active: payload.isActive })
        .eq('id', payload.shareId)
        .eq('venue_id', venueId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ share: updated });
    }

    if (payload.action === 'save_allocations') {
      // Validate every share belongs to this venue.
      const shareIds = payload.allocations.map((entry) => entry.shareId);
      const { data: ownedShares, error: ownedError } = await supabase
        .from('agency_portal_shares')
        .select('id')
        .eq('venue_id', venueId)
        .in('id', shareIds);

      if (ownedError) {
        return NextResponse.json({ error: ownedError.message }, { status: 500 });
      }

      const ownedIds = new Set((ownedShares || []).map((row) => row.id));
      const unknown = shareIds.filter((id) => !ownedIds.has(id));
      if (unknown.length > 0) {
        return NextResponse.json({ error: 'One or more shares do not belong to this venue.' }, { status: 403 });
      }

      // Total allocations must not exceed the agency's monthly pool limit.
      const pool = await getAgencyPool(venueId);
      const totalAllocated = payload.allocations.reduce((sum, entry) => sum + Number(entry.allocation || 0), 0);
      if (totalAllocated > pool.limit) {
        return NextResponse.json(
          {
            error: `Total allocations (${totalAllocated.toLocaleString('en-GB')}) exceed your monthly message limit (${pool.limit.toLocaleString('en-GB')}).`,
          },
          { status: 400 }
        );
      }

      await Promise.all(
        payload.allocations.map((entry) =>
          supabase
            .from('agency_portal_shares')
            .update({ message_credit_allocation: entry.allocation })
            .eq('id', entry.shareId)
            .eq('venue_id', venueId)
        )
      );

      return NextResponse.json({ success: true, pool, totalAllocated });
    }

    if (payload.action === 'regenerate_credentials') {
      const providedPassword = payload.password?.trim();
      const tempPassword = providedPassword ? null : generateTemporaryPassword();
      const passwordHash = hashPassword(providedPassword || tempPassword!);

      const { data: share } = await supabase
        .from('agency_portal_shares')
        .select('id')
        .eq('id', payload.shareId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (!share) {
        return NextResponse.json({ error: 'Share not found for venue' }, { status: 404 });
      }

      let upsertedUser;
      try {
        upsertedUser = await upsertPortalUser({
          shareId: payload.shareId,
          venueId,
          email: payload.email.toLowerCase(),
          passwordHash,
          updatePassword: true,
          mustResetPassword: false,
          createdByUserId: userId,
        });
      } catch (userError: any) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      return NextResponse.json({
        user: upsertedUser.user,
        temporaryPassword: tempPassword,
      });
    }

    const validTour = await assertTourInVenue(venueId, payload.tourId);
    if (!validTour) {
      return NextResponse.json({ error: 'Tour not found for venue' }, { status: 404 });
    }

    const shareSlug = normaliseSlug(payload.shareSlug);
    if (shareSlug.length < 3) {
      return NextResponse.json({ error: 'Share slug must be at least 3 characters.' }, { status: 400 });
    }

    const enabledModules = {
      tour: payload.enabledModules?.tour ?? true,
      settings: payload.enabledModules?.settings ?? true,
      customisation: payload.enabledModules?.customisation ?? true,
      analytics: payload.enabledModules?.analytics ?? true,
      share: payload.enabledModules?.share ?? true,
      tour_blocks: {
        setup: payload.enabledModules?.tour_blocks?.setup ?? true,
        menu: payload.enabledModules?.tour_blocks?.menu ?? true,
      },
      settings_blocks: {
        config: payload.enabledModules?.settings_blocks?.config ?? true,
        information: payload.enabledModules?.settings_blocks?.information ?? true,
        documents: payload.enabledModules?.settings_blocks?.documents ?? true,
        triggers: payload.enabledModules?.settings_blocks?.triggers ?? true,
      },
    };

    const shareData = {
      venue_id: venueId,
      tour_id: payload.tourId,
      share_slug: shareSlug,
      is_active: payload.isActive ?? true,
      enabled_modules: enabledModules,
      created_by_user_id: userId,
    };

    let upsertedShare: any = null;
    if (payload.shareId) {
      const { data: updatedShare, error } = await supabase
        .from('agency_portal_shares')
        .update({
          tour_id: shareData.tour_id,
          share_slug: shareData.share_slug,
          is_active: shareData.is_active,
          enabled_modules: shareData.enabled_modules,
        })
        .eq('id', payload.shareId)
        .eq('venue_id', venueId)
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This slug is already in use. Choose a different slug.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      upsertedShare = updatedShare;
    } else {
      const { data: createdShare, error } = await supabase
        .from('agency_portal_shares')
        .insert(shareData)
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This slug is already in use. Choose a different slug.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      upsertedShare = createdShare;
    }

    let temporaryPassword: string | null = null;
    let createdUser: any = null;
    if (payload.clientEmail) {
      const normalisedEmail = payload.clientEmail.toLowerCase();
      const providedPassword = payload.clientPassword?.trim();
      const generatedPassword = providedPassword ? null : generateTemporaryPassword();
      const passwordHash = hashPassword(providedPassword || generatedPassword!);
      const shouldUpdatePassword = Boolean(providedPassword || payload.regeneratePassword);

      let userRecord;
      try {
        userRecord = await upsertPortalUser({
          shareId: upsertedShare.id,
          venueId,
          email: normalisedEmail,
          passwordHash,
          updatePassword: shouldUpdatePassword,
          mustResetPassword: false,
          createdByUserId: userId,
        });
      } catch (userError: any) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      temporaryPassword = userRecord.passwordUpdated && generatedPassword ? generatedPassword : null;
      createdUser = userRecord.user;
    }

    return NextResponse.json({
      share: upsertedShare,
      user: createdUser,
      temporaryPassword,
    });
  } catch (error: any) {
    console.error('Error updating agency portal share:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update agency portal share' },
      { status: 500 }
    );
  }
}

