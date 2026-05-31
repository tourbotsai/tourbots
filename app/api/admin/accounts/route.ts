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

    const [usersResult, toursResult, billingResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, venue_id, first_name, last_name, email, phone, role, created_at")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("tours")
        .select("id, venue_id")
        .in("venue_id", venueIds),
      supabase
        .from("venue_billing_records")
        .select("venue_id, plan_code, override_plan_code, billing_override_enabled")
        .in("venue_id", venueIds),
    ]);

    if (usersResult.error) {
      throw new Error(usersResult.error.message);
    }

    if (toursResult.error) {
      throw new Error(toursResult.error.message);
    }

    if (billingResult.error) {
      throw new Error(billingResult.error.message);
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

    const billingByVenue = new Map<string, any>();
    for (const record of billingResult.data || []) {
      billingByVenue.set(record.venue_id, record);
    }

    const accounts = (venues || []).map((venue) => {
      const venueUsers = usersByVenue.get(venue.id) || [];
      const primaryUser = venueUsers[0];
      const contactName = primaryUser
        ? `${primaryUser.first_name || ""} ${primaryUser.last_name || ""}`.trim() || "Not set"
        : "Not set";

      const billingRecord = billingByVenue.get(venue.id);
      const effectivePlanCode =
        billingRecord?.billing_override_enabled && billingRecord?.override_plan_code
          ? billingRecord.override_plan_code
          : billingRecord?.plan_code || "free";
      const isPlatformAdmin = venueUsers.some((user) => user.role === "platform_admin");
      const accountType = isPlatformAdmin ? "platform_admin" : effectivePlanCode;

      return {
        id: venue.id,
        companyName: venue.name,
        contactName,
        email: primaryUser?.email || venue.email || "",
        phone: primaryUser?.phone || venue.phone || "",
        accountType,
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
