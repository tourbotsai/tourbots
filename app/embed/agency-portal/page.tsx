import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { isAllowedDomain } from '@/lib/agency-portal-auth';
import { ENTITLEMENT_COLUMNS, venueHasAgencyPortal } from '@/lib/billing-entitlements';
import { AgencyPortalEntry } from './agency-portal-entry';

export const dynamic = 'force-dynamic';

/**
 * Universal agency portal embed. Unlike the per-client `/embed/agency/[shareSlug]`
 * route, this single page is branded per agency (via the `agency` venue id) and
 * resolves the client by email at login time, so an agency only needs one embed
 * across all of their clients.
 */
export default async function AgencyPortalUniversalPage({
  searchParams,
}: {
  searchParams: { agency?: string; showHeader?: string };
}) {
  const agencyId = searchParams.agency;
  if (!agencyId) notFound();

  const { data: settings } = await supabase
    .from('agency_portal_settings')
    .select('agency_name, logo_url, primary_colour, secondary_colour, is_enabled, allowed_domains')
    .eq('venue_id', agencyId)
    .maybeSingle();

  if (!settings?.is_enabled) notFound();

  const { data: billingRecord, error: billingError } = await supabase
    .from('venue_billing_records')
    .select(ENTITLEMENT_COLUMNS)
    .eq('venue_id', agencyId)
    .maybeSingle();

  const entitlementActive = billingError ? true : venueHasAgencyPortal(billingRecord as any);
  if (!entitlementActive) notFound();

  const requestHeaders = headers();
  const referer = requestHeaders.get('referer');
  const origin = requestHeaders.get('origin');
  const hostCandidates: string[] = [];
  try {
    if (referer) hostCandidates.push(new URL(referer).hostname);
  } catch {}
  try {
    if (origin) hostCandidates.push(new URL(origin).hostname);
  } catch {}
  if (hostCandidates.length > 0 && !isAllowedDomain(settings.allowed_domains || [], hostCandidates)) {
    notFound();
  }

  const showHeader = searchParams.showHeader !== 'false';

  return (
    <AgencyPortalEntry
      agencyId={agencyId}
      agencyName={settings.agency_name || 'Agency Portal'}
      agencyLogoUrl={settings.logo_url || null}
      primaryColour={settings.primary_colour || '#1E40AF'}
      secondaryColour={settings.secondary_colour || '#0F172A'}
      showHeader={showHeader}
    />
  );
}
