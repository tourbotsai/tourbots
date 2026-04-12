import { supabaseServiceRole as supabase } from './supabase-service-role';
import { User, Venue, UserWithVenue } from './types';

const PLATFORM_ADMIN_EMAIL = 'hello@tourbots.ai';

// Create a user in the users table
export async function createUser({
  firebase_uid,
  email,
  first_name = null,
  last_name = null,
  profile_image_url = null,
  role = 'admin', // Default to admin for venue owners
  venue_id = null,
  phone = null,
}: {
  firebase_uid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  role?: string;
  venue_id?: string | null;
  phone?: string | null;
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        firebase_uid,
        email,
        first_name,
        last_name,
        profile_image_url,
        role,
        venue_id,
        phone,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create a venue row in the venues table
export async function createVenue({
  name,
  slug,
  address = '',
  city = '',
  postcode = '',
  country = 'UK',
  owner_id,
  description = null,
  phone = null,
  email = null,
  website_url = null,
}: {
  name: string;
  slug: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  owner_id: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
}): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .insert([
      {
        name,
        slug,
        address,
        city,
        postcode,
        country,
        owner_id,
        description,
        phone,
        email,
        website_url,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user by Firebase UID
export async function getUserByFirebaseUid(firebase_uid: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebase_uid)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data;
}

// Get user with venue data
export async function getUserWithVenue(firebase_uid: string): Promise<UserWithVenue | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      venue:venue_id (*)
    `)
    .eq('firebase_uid', firebase_uid)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data;
}

// Update user
export async function updateUser(id: string, fields: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update venue
export async function updateVenue(id: string, fields: Partial<Venue>): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Link user to venue (update user's venue_id)
export async function linkUserToVenue(userId: string, venueId: string): Promise<User | null> {
  return updateUser(userId, { venue_id: venueId });
}

// Generate unique venue slug from name
export function generateVenueSlug(venueName: string): string {
  return venueName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Complete venue registration flow
export async function completeVenueRegistration({
  firebase_uid,
  email,
  first_name,
  last_name,
  venue_name,
  address = '',
  city = '',
  postcode = '',
  phone = null,
}: {
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  venue_name: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string | null;
}): Promise<{ user: User; venue: Venue }> {
  // Check if user already exists
  const existingUser = await getUserByFirebaseUid(firebase_uid);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const venue_slug = generateVenueSlug(venue_name);

  // Determine role based on email
  const role = email === PLATFORM_ADMIN_EMAIL ? 'platform_admin' : 'admin';

  try {
    // Create user first
    const user = await createUser({
      firebase_uid,
      email,
      first_name,
      last_name,
      role, // Use the determined role
      phone,
    });

    if (!user) throw new Error('Failed to create user');

    const venue = await createVenue({
      name: venue_name,
      slug: venue_slug,
      address,
      city,
      postcode,
      owner_id: user.id,
      email,
      phone,
    });

    if (!venue) throw new Error('Failed to create venue');

    try {
      await supabase
        .from('user_venue_access')
        .insert({
          user_id: user.id,
          venue_id: venue.id,
          role: 'owner',
          created_by: user.id,
        })
        .select('id')
        .maybeSingle();
    } catch (accessError) {
      // Non-blocking during rollout, but team features expect migration 26 to be applied.
      console.warn('Failed to create owner access row in user_venue_access:', accessError);
    }

    await linkUserToVenue(user.id, venue.id);

    return { user, venue };
  } catch (error) {
    console.error('Error in completeVenueRegistration:', error);
    throw error;
  }
}

// Update user role by email (for admin fixes)
export async function updateUserRoleByEmail(email: string, role: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()
    .single();
  
  if (error) throw error;
  return data;
} 