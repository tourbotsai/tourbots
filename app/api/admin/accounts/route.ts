import { NextRequest, NextResponse } from "next/server";
import { supabaseServiceRole as supabase } from "@/lib/supabase-service-role";
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { data: venues, error: venuesError } = await supabase
      .from("venues")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (venuesError) {
      throw new Error(venuesError.message);
    }

    const venueIds = (venues || []).map((venue) => venue.id);

    if (venueIds.length === 0) {
      return NextResponse.json({ accounts: [] });
    }

    const [usersResult, toursResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, venue_id, first_name, last_name, email, phone, created_at")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("tours")
        .select("id, venue_id")
        .in("venue_id", venueIds),
    ]);

    if (usersResult.error) {
      throw new Error(usersResult.error.message);
    }

    if (toursResult.error) {
      throw new Error(toursResult.error.message);
    }

    const usersByVenue = new Map<string, any[]>();
    for (const user of usersResult.data || []) {
      const existing = usersByVenue.get(user.venue_id) || [];
      existing.push(user);
      usersByVenue.set(user.venue_id, existing);
    }

    const tourCountByVenue = new Map<string, number>();
    for (const tour of toursResult.data || []) {
      tourCountByVenue.set(tour.venue_id, (tourCountByVenue.get(tour.venue_id) || 0) + 1);
    }

    const accounts = (venues || []).map((venue) => {
      const venueUsers = usersByVenue.get(venue.id) || [];
      const primaryUser = venueUsers[0];
      const contactName = primaryUser
        ? `${primaryUser.first_name || ""} ${primaryUser.last_name || ""}`.trim() || "Not set"
        : "Not set";

      return {
        id: venue.id,
        companyName: venue.name,
        contactName,
        email: primaryUser?.email || venue.email || "",
        phone: primaryUser?.phone || venue.phone || "",
        toursCount: tourCountByVenue.get(venue.id) || 0,
        createdAt: venue.created_at,
      };
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Error fetching admin accounts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}
