import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { AgencyPortalShell } from './agency-portal-shell';
import { isAllowedDomain } from '@/lib/agency-portal-auth';

export const dynamic = 'force-dynamic';

async function getAgencyPreviewData(shareSlug: string) {
  const { data: share, error: shareError } = await supabase
    .from('agency_portal_shares')
    .select(`
      id,
      venue_id,
      tour_id,
      share_slug,
      is_active,
      enabled_modules,
      tours (
        id,
        title
      ),
      venues (
        id,
        name
      )
    `)
    .eq('share_slug', shareSlug)
    .maybeSingle();

  if (shareError || !share) return null;

  const { data: settings } = await supabase
    .from('agency_portal_settings')
    .select('agency_name, logo_url, primary_colour, secondary_colour, is_enabled, allowed_domains')
    .eq('venue_id', share.venue_id)
    .maybeSingle();

  const { data: billingRecord, error: billingError } = await supabase
    .from('venue_billing_records')
    .select('addon_agency_portal')
    .eq('venue_id', share.venue_id)
    .maybeSingle();

  const entitlementActive = billingError ? true : Boolean(billingRecord?.addon_agency_portal);
  return { share, settings, entitlementActive };
}

export default async function AgencyEmbedPreviewPage({
  params,
  searchParams,
}: {
  params: { shareSlug: string };
  searchParams: {
    title?: string;
    showHeader?: string;
  };
}) {
  const data = await getAgencyPreviewData(params.shareSlug);
  if (!data) notFound();

  const { share, settings, entitlementActive } = data;
  if (!settings?.is_enabled || !entitlementActive) notFound();

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

  const tour = Array.isArray(share.tours) ? share.tours[0] : share.tours;
  const venue = Array.isArray(share.venues) ? share.venues[0] : share.venues;
  const modules = {
    tour: share.enabled_modules?.tour !== false,
    settings: share.enabled_modules?.settings !== false,
    customisation: share.enabled_modules?.customisation !== false,
    analytics: share.enabled_modules?.analytics !== false,
  };
  const settingsBlocks = {
    config: share.enabled_modules?.settings_blocks?.config !== false,
    information: share.enabled_modules?.settings_blocks?.information !== false,
    documents: share.enabled_modules?.settings_blocks?.documents !== false,
    triggers: share.enabled_modules?.settings_blocks?.triggers !== false,
  };

  const primaryColour = settings?.primary_colour || '#1E40AF';
  const secondaryColour = settings?.secondary_colour || '#0F172A';
  const agencyName = searchParams.title || settings?.agency_name || venue?.name || 'Agency Portal';
  const showHeader = searchParams.showHeader !== 'false';

  return (
    <AgencyPortalShell
      shareSlug={share.share_slug}
      tourId={tour?.id || null}
      shareActive={Boolean(share.is_active)}
      agencyName={agencyName}
      agencyLogoUrl={settings?.logo_url || null}
      tourTitle={tour?.title || 'Tour'}
      showHeader={showHeader}
      primaryColour={primaryColour}
      secondaryColour={secondaryColour}
      modules={modules}
      venueId={share.venue_id}
      venueName={venue?.name || null}
      settingsBlocks={settingsBlocks}
    />
  );
}

