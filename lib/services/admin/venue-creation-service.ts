import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { createVenue, createUser, linkUserToVenue, generateVenueSlug } from '@/lib/user-service';
import { AdminVenueCreationRequest, Venue, User } from '@/lib/types';
import { auth } from '@/lib/firebase-admin';

export async function createVenueAccountForCustomer(
  request: AdminVenueCreationRequest,
  createdByAdminId: string
): Promise<{ venue: Venue; user: User; tempPassword: string; isExistingUser: boolean }> {
  const {
    venueName,
    ownerEmail,
    ownerFirstName,
    ownerLastName,
    phone,
    address = '',
    city = '',
    postcode = '',
    planName,
    enableSetupMode,
    customPassword
  } = request;

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, firebase_uid, first_name, last_name')
      .eq('email', ownerEmail.toLowerCase().trim())
      .single();

    let user: User;
    let tempPassword: string;
    let isExistingUser = false;

    if (existingUser) {
      user = existingUser as User;
      tempPassword = '';
      isExistingUser = true;
      console.log(`Using existing user account: ${ownerEmail}`);
    } else {
      tempPassword = customPassword || generateTempPassword();

      const firebaseUser = await auth.createUser({
        email: ownerEmail,
        password: tempPassword,
        displayName: `${ownerFirstName} ${ownerLastName}`,
        emailVerified: false,
      });

      const createdUser = await createUser({
        firebase_uid: firebaseUser.uid,
        email: ownerEmail,
        first_name: ownerFirstName,
        last_name: ownerLastName,
        phone: phone || null,
        role: 'admin',
      });

      if (!createdUser) {
        throw new Error('Failed to create user in database');
      }

      user = createdUser;
      console.log(`Created new user account: ${ownerEmail}`);
    }

    const venueSlug = generateVenueSlug(venueName);
    const venue = await createVenue({
      name: venueName,
      slug: venueSlug,
      address,
      city,
      postcode,
      owner_id: user.id,
      email: ownerEmail,
      phone: phone || null,
    });

    if (!venue) {
      throw new Error('Failed to create venue');
    }

    await supabase.from('user_venue_access').insert({
      user_id: user.id,
      venue_id: venue.id,
      role: 'owner',
      created_by: createdByAdminId,
    });

    const { data: currentUser } = await supabase
      .from('users')
      .select('venue_id')
      .eq('id', user.id)
      .single();

    if (!currentUser?.venue_id) {
      await linkUserToVenue(user.id, venue.id);
    }

    if (enableSetupMode) {
      await supabase
        .from('venues')
        .update({ in_setup: true })
        .eq('id', venue.id);
    }

    await logAdminAction({
      venue_id: venue.id,
      admin_user_id: createdByAdminId,
      action_type: isExistingUser ? 'venue_added_to_existing_user' : 'new_venue_account_created',
      action_details: {
        plan_name: planName,
        venue_name: venueName,
        owner_email: ownerEmail,
        is_existing_user: isExistingUser,
        user_venue_count: isExistingUser ? 'multiple' : '1',
      },
      notes: isExistingUser
        ? `Added venue "${venueName}" to existing user ${ownerEmail}`
        : `Created new venue account for ${venueName}${enableSetupMode ? ' with setup mode enabled' : ''}`,
    });

    return {
      venue: { ...venue, in_setup: enableSetupMode },
      user,
      tempPassword,
      isExistingUser,
    };
  } catch (error: any) {
    console.error('Error creating venue account:', error);
    throw new Error(`Failed to create venue account: ${error.message}`);
  }
}

export async function toggleSetupMode(
  venueId: string,
  enableSetupMode: boolean,
  adminUserId: string,
  notes?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('venues')
      .update({ in_setup: enableSetupMode })
      .eq('id', venueId);

    if (error) throw error;

    await logAdminAction({
      venue_id: venueId,
      admin_user_id: adminUserId,
      action_type: enableSetupMode ? 'setup_mode_enabled' : 'setup_mode_disabled',
      action_details: { in_setup: enableSetupMode },
      notes: notes || `Admin ${enableSetupMode ? 'enabled' : 'disabled'} setup mode`,
    });
  } catch (error: any) {
    console.error('Error toggling setup mode:', error);
    throw new Error(`Failed to toggle setup mode: ${error.message}`);
  }
}

async function logAdminAction(action: {
  venue_id: string;
  admin_user_id: string;
  action_type: string;
  action_details: any;
  notes: string;
}): Promise<void> {
  try {
    await supabase.from('admin_subscription_actions').insert({
      venue_id: action.venue_id,
      admin_user_id: action.admin_user_id,
      action_type: action.action_type,
      action_details: action.action_details,
      notes: action.notes,
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

function generateTempPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
