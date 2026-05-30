-- 65_add_agency_portal_background_colour.sql
-- Adds an agency-controllable background colour for the client portal surface
-- (the area behind the portal cards, previously a fixed slate-50). Optional;
-- when null the portal falls back to its default slate-50 background.

alter table if exists public.agency_portal_settings
  add column if not exists portal_background_colour text;

alter table if exists public.agency_portal_settings
  drop constraint if exists chk_agency_portal_settings_portal_background_colour_hex;

alter table if exists public.agency_portal_settings
  add constraint chk_agency_portal_settings_portal_background_colour_hex
    check (
      portal_background_colour is null
      or portal_background_colour ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
    );
