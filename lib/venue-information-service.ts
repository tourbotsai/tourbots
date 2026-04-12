import { supabase } from './supabase';
import { VenueInformation } from './types';

export async function getVenueInformation(venueId: string): Promise<VenueInformation | null> {
  const { data, error } = await supabase
    .from('venue_information')
    .select('*')
    .eq('venue_id', venueId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function upsertVenueInformation(
  venueId: string,
  information: Partial<Omit<VenueInformation, 'id' | 'venue_id' | 'created_at' | 'updated_at'>>
): Promise<VenueInformation> {
  const { data, error } = await supabase
    .from('venue_information')
    .upsert({
      venue_id: venueId,
      ...information,
    }, {
      onConflict: 'venue_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVenueInformation(venueId: string): Promise<void> {
  const { error } = await supabase
    .from('venue_information')
    .delete()
    .eq('venue_id', venueId);

  if (error) throw error;
}

export function formatVenueInformationForPrompt(venueInfo: VenueInformation | null): string {
  if (!venueInfo) return '';

  const sections = [];

  if (venueInfo.venue_name || venueInfo.tagline || venueInfo.description) {
    const basicInfo = [];
    if (venueInfo.venue_name) basicInfo.push(`Venue Name: ${venueInfo.venue_name}`);
    if (venueInfo.tagline) basicInfo.push(`Tagline: ${venueInfo.tagline}`);
    if (venueInfo.description) basicInfo.push(`Description: ${venueInfo.description}`);
    if (venueInfo.website_url) basicInfo.push(`Website: ${venueInfo.website_url}`);
    if (venueInfo.phone_number) basicInfo.push(`Phone: ${venueInfo.phone_number}`);
    if (venueInfo.email) basicInfo.push(`Email: ${venueInfo.email}`);

    if (basicInfo.length > 0) {
      sections.push(`BASIC INFORMATION:\n${basicInfo.join('\n')}`);
    }
  }

  if (venueInfo.full_address || venueInfo.city || venueInfo.parking_information || venueInfo.public_transport) {
    const locationInfo = [];
    if (venueInfo.full_address) locationInfo.push(`Address: ${venueInfo.full_address}`);
    if (venueInfo.city && venueInfo.postcode && venueInfo.country) {
      locationInfo.push(`Location: ${venueInfo.city}, ${venueInfo.postcode}, ${venueInfo.country}`);
    }
    if (venueInfo.parking_information) locationInfo.push(`Parking: ${venueInfo.parking_information}`);
    if (venueInfo.public_transport) locationInfo.push(`Public Transport: ${venueInfo.public_transport}`);

    if (locationInfo.length > 0) {
      sections.push(`LOCATION & CONTACT:\n${locationInfo.join('\n')}`);
    }
  }

  const hours = [
    { day: 'Monday', hours: venueInfo.monday_hours },
    { day: 'Tuesday', hours: venueInfo.tuesday_hours },
    { day: 'Wednesday', hours: venueInfo.wednesday_hours },
    { day: 'Thursday', hours: venueInfo.thursday_hours },
    { day: 'Friday', hours: venueInfo.friday_hours },
    { day: 'Saturday', hours: venueInfo.saturday_hours },
    { day: 'Sunday', hours: venueInfo.sunday_hours },
  ].filter(h => h.hours).map(h => `${h.day}: ${h.hours}`);

  if (hours.length > 0) {
    sections.push(`OPENING HOURS:\n${hours.join('\n')}`);
    if (venueInfo.holiday_hours) {
      sections.push(`Holiday Hours: ${venueInfo.holiday_hours}`);
    }
  }

  if (venueInfo.cardio_equipment || venueInfo.strength_equipment || venueInfo.functional_training ||
      venueInfo.speciality_areas || venueInfo.changing_facilities || venueInfo.additional_amenities) {
    const facilities = [];
    if (venueInfo.cardio_equipment) facilities.push(`Cardio Equipment: ${venueInfo.cardio_equipment}`);
    if (venueInfo.strength_equipment) facilities.push(`Strength Equipment: ${venueInfo.strength_equipment}`);
    if (venueInfo.functional_training) facilities.push(`Functional Training: ${venueInfo.functional_training}`);
    if (venueInfo.speciality_areas) facilities.push(`Speciality Areas: ${venueInfo.speciality_areas}`);
    if (venueInfo.changing_facilities) facilities.push(`Changing Facilities: ${venueInfo.changing_facilities}`);
    if (venueInfo.additional_amenities) facilities.push(`Additional Amenities: ${venueInfo.additional_amenities}`);

    if (facilities.length > 0) {
      sections.push(`FACILITIES & EQUIPMENT:\n${facilities.join('\n')}`);
    }
  }

  if (venueInfo.membership_types || venueInfo.pricing_information || venueInfo.student_discounts ||
      venueInfo.corporate_memberships || venueInfo.day_passes || venueInfo.payment_methods) {
    const membership = [];
    if (venueInfo.membership_types) membership.push(`Membership Types: ${venueInfo.membership_types}`);
    if (venueInfo.pricing_information) membership.push(`Pricing: ${venueInfo.pricing_information}`);
    if (venueInfo.student_discounts) membership.push(`Student Discounts: ${venueInfo.student_discounts}`);
    if (venueInfo.corporate_memberships) membership.push(`Corporate Memberships: ${venueInfo.corporate_memberships}`);
    if (venueInfo.day_passes) membership.push(`Day Passes: ${venueInfo.day_passes}`);
    if (venueInfo.payment_methods) membership.push(`Payment Methods: ${venueInfo.payment_methods}`);

    if (membership.length > 0) {
      sections.push(`MEMBERSHIP & PRICING:\n${membership.join('\n')}`);
    }
  }

  if (venueInfo.group_fitness_classes || venueInfo.personal_training || venueInfo.speciality_programs || venueInfo.class_schedule) {
    const classes = [];
    if (venueInfo.group_fitness_classes) classes.push(`Group Fitness Classes: ${venueInfo.group_fitness_classes}`);
    if (venueInfo.personal_training) classes.push(`Personal Training: ${venueInfo.personal_training}`);
    if (venueInfo.speciality_programs) classes.push(`Speciality Programs: ${venueInfo.speciality_programs}`);
    if (venueInfo.class_schedule) classes.push(`Class Schedule: ${venueInfo.class_schedule}`);

    if (classes.length > 0) {
      sections.push(`CLASSES & PROGRAMS:\n${classes.join('\n')}`);
    }
  }

  if (venueInfo.age_restrictions || venueInfo.guest_policy || venueInfo.cancellation_policy ||
      venueInfo.health_safety || venueInfo.dress_code) {
    const policies = [];
    if (venueInfo.age_restrictions) policies.push(`Age Restrictions: ${venueInfo.age_restrictions}`);
    if (venueInfo.guest_policy) policies.push(`Guest Policy: ${venueInfo.guest_policy}`);
    if (venueInfo.cancellation_policy) policies.push(`Cancellation Policy: ${venueInfo.cancellation_policy}`);
    if (venueInfo.health_safety) policies.push(`Health & Safety: ${venueInfo.health_safety}`);
    if (venueInfo.dress_code) policies.push(`Dress Code: ${venueInfo.dress_code}`);

    if (policies.length > 0) {
      sections.push(`POLICIES & RULES:\n${policies.join('\n')}`);
    }
  }

  if (venueInfo.personal_trainers || venueInfo.nutritionists || venueInfo.physiotherapy || venueInfo.other_services) {
    const staff = [];
    if (venueInfo.personal_trainers) staff.push(`Personal Trainers: ${venueInfo.personal_trainers}`);
    if (venueInfo.nutritionists) staff.push(`Nutritionists: ${venueInfo.nutritionists}`);
    if (venueInfo.physiotherapy) staff.push(`Physiotherapy: ${venueInfo.physiotherapy}`);
    if (venueInfo.other_services) staff.push(`Other Services: ${venueInfo.other_services}`);

    if (staff.length > 0) {
      sections.push(`STAFF & SERVICES:\n${staff.join('\n')}`);
    }
  }

  if (venueInfo.accessibility || venueInfo.technology || venueInfo.community_programs || venueInfo.awards_certifications) {
    const features = [];
    if (venueInfo.accessibility) features.push(`Accessibility: ${venueInfo.accessibility}`);
    if (venueInfo.technology) features.push(`Technology: ${venueInfo.technology}`);
    if (venueInfo.community_programs) features.push(`Community Programs: ${venueInfo.community_programs}`);
    if (venueInfo.awards_certifications) features.push(`Awards & Certifications: ${venueInfo.awards_certifications}`);

    if (features.length > 0) {
      sections.push(`SPECIAL FEATURES:\n${features.join('\n')}`);
    }
  }

  return sections.length > 0 ? `\n\nVENUE INFORMATION:\n${sections.join('\n\n')}` : '';
}

export function getVenueInformationCompleteness(venueInfo: VenueInformation | null): number {
  if (!venueInfo) return 0;

  const allFields = [
    venueInfo.venue_name, venueInfo.tagline, venueInfo.description,
    venueInfo.website_url, venueInfo.phone_number, venueInfo.email,
    venueInfo.full_address, venueInfo.city, venueInfo.postcode, venueInfo.country,
    venueInfo.parking_information, venueInfo.public_transport,
    venueInfo.monday_hours, venueInfo.tuesday_hours, venueInfo.wednesday_hours, venueInfo.thursday_hours,
    venueInfo.friday_hours, venueInfo.saturday_hours, venueInfo.sunday_hours, venueInfo.holiday_hours,
    venueInfo.cardio_equipment, venueInfo.strength_equipment, venueInfo.functional_training,
    venueInfo.speciality_areas, venueInfo.changing_facilities, venueInfo.additional_amenities,
    venueInfo.membership_types, venueInfo.pricing_information, venueInfo.student_discounts,
    venueInfo.corporate_memberships, venueInfo.day_passes, venueInfo.payment_methods,
    venueInfo.group_fitness_classes, venueInfo.personal_training,
    venueInfo.speciality_programs, venueInfo.class_schedule,
    venueInfo.age_restrictions, venueInfo.guest_policy, venueInfo.cancellation_policy,
    venueInfo.health_safety, venueInfo.dress_code,
    venueInfo.personal_trainers, venueInfo.nutritionists,
    venueInfo.physiotherapy, venueInfo.other_services,
    venueInfo.accessibility, venueInfo.technology,
    venueInfo.community_programs, venueInfo.awards_certifications,
  ];

  const filledFields = allFields.filter(field => field && field.trim() !== '').length;
  return Math.round((filledFields / allFields.length) * 100);
}
