-- 38_revoke_anon_authenticated_privileged_grants.sql
-- Tighten public schema grants so anon/authenticated cannot perform privileged reads/writes.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Re-grant only minimum read surface required for public embeds.
GRANT SELECT ON TABLE
  public.tours,
  public.tour_points,
  public.tour_menu_settings,
  public.tour_menu_blocks,
  public.chatbot_configs,
  public.chatbot_customisations,
  public.chatbot_triggers,
  public.chatbot_info_sections,
  public.chatbot_info_fields
TO anon, authenticated;

-- Restrict critical RPC usage to trusted backend role.
REVOKE ALL ON FUNCTION public.increment_rate_limit_count(uuid, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit_count(uuid, text, text, timestamptz)
  TO service_role;

DO $$
BEGIN
  IF to_regprocedure('public.increment_hard_limit_usage(uuid,text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.increment_hard_limit_usage(uuid, text)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.increment_hard_limit_usage(uuid, text)
      TO service_role;
  END IF;

  IF to_regprocedure('public.increment_hard_limit_usage(uuid,text,uuid)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.increment_hard_limit_usage(uuid, text, uuid)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.increment_hard_limit_usage(uuid, text, uuid)
      TO service_role;
  END IF;
END $$;
