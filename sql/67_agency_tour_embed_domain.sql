-- 67_agency_tour_embed_domain.sql
-- White-label tour embed domain for the Agency Portal.
--
-- An agency can connect their own domain (e.g. tours.theiragency.com) so the tour
-- embed code their clients copy from the portal Share tab uses the agency domain
-- instead of tourbots.ai. The domain is attached to the Vercel project via the
-- Domains API (see lib/services/vercel-domain-service.ts); these columns track the
-- configured host and its verification lifecycle. When no domain is verified the
-- embed code falls back to tourbots.ai, so existing agencies are unaffected.
--
-- Status lifecycle:
--   unconfigured -> no domain set (default); embed uses tourbots.ai.
--   pending      -> domain saved, awaiting DNS records from the agency.
--   verifying    -> added to Vercel, DNS not yet propagated (misconfigured = true).
--   verified     -> Vercel reports misconfigured = false; embed uses this host.
--   failed       -> connect/verify error (message surfaced to the agency).

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain text;

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain_status text not null default 'unconfigured';

alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_domain_verified_at timestamptz;

-- Cache of the DNS records / verification challenge returned by Vercel so the
-- settings UI can display them without re-calling the API on every page load.
alter table if exists public.agency_portal_settings
  add column if not exists tour_embed_dns_records jsonb;

alter table if exists public.agency_portal_settings
  drop constraint if exists chk_agency_portal_settings_tour_embed_domain_status;

alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_tour_embed_domain_status
    check (tour_embed_domain_status in
      ('unconfigured', 'pending', 'verifying', 'verified', 'failed'));

-- Hostname sanity: lowercase, at least two dot-separated labels, each label
-- starting/ending alphanumeric with optional internal hyphens. POSIX-safe
-- (no lookaround), allow null.
alter table if exists public.agency_portal_settings
  drop constraint if exists chk_agency_portal_settings_tour_embed_domain_format;

alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_tour_embed_domain_format
    check (
      tour_embed_domain is null
      or tour_embed_domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
    );
