-- 43_narrow_anon_public_table_reads.sql
-- Purpose: remove broad anon/authenticated read surface from embed-related public tables.
-- Assumption: public/embed endpoints read via server routes using service_role.

BEGIN;

-- Remove direct table grants for anon/authenticated.
REVOKE SELECT ON TABLE
  public.tours,
  public.tour_points,
  public.tour_menu_settings,
  public.tour_menu_blocks,
  public.chatbot_configs,
  public.chatbot_customisations,
  public.chatbot_triggers,
  public.chatbot_info_sections,
  public.chatbot_info_fields
FROM anon, authenticated;

-- Remove broad public read RLS policies.
DROP POLICY IF EXISTS anon_read_active_tours ON public.tours;
DROP POLICY IF EXISTS anon_read_enabled_tour_menu_settings ON public.tour_menu_settings;
DROP POLICY IF EXISTS anon_read_enabled_tour_menu_blocks ON public.tour_menu_blocks;
DROP POLICY IF EXISTS anon_read_active_tour_points ON public.tour_points;
DROP POLICY IF EXISTS anon_read_active_chatbot_configs ON public.chatbot_configs;
DROP POLICY IF EXISTS anon_read_active_chatbot_customisations ON public.chatbot_customisations;
DROP POLICY IF EXISTS anon_read_active_chatbot_triggers ON public.chatbot_triggers;
DROP POLICY IF EXISTS anon_read_active_chatbot_info_sections ON public.chatbot_info_sections;
DROP POLICY IF EXISTS anon_read_active_chatbot_info_fields ON public.chatbot_info_fields;

COMMIT;
