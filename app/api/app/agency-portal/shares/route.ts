import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, scryptSync } from 'crypto';
import { z } from 'zod';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

const enabledModulesSchema = z.object({
  tour: z.boolean().optional(),
  settings: z.boolean().optional(),
  customisation: z.boolean().optional(),
  analytics: z.boolean().optional(),
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

const actionSchema = z.discriminatedUnion('action', [
  upsertShareSchema,
  toggleShareSchema,
  createCredentialSchema,
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
    .select('addon_agency_portal')
    .eq('venue_id', venueId)
    .maybeSingle();
  return Boolean(data?.addon_agency_portal);
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

    const { venueId } = authResult;
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

    return NextResponse.json({
      entitlement: { addon_agency_portal: entitlementEnabled },
      tours: tours || [],
      shares: (shares || []).map((share) => ({
        ...share,
        users: usersByShareId[share.id] || [],
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
    const { venueId, userId } = authResult;

    const entitlementEnabled = await getEntitlement(venueId);
    if (!entitlementEnabled) {
      return NextResponse.json(
        { error: 'Agency Portal add-on is required before creating shares.' },
        { status: 403 }
      );
    }

    const body = await request.json();
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

