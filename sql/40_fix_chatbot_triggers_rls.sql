-- 40_fix_chatbot_triggers_rls.sql
-- Follow-up fix: ensure chatbot_triggers has RLS enabled after migration 37/38 rollout.

ALTER TABLE IF EXISTS public.chatbot_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_chatbot_triggers ON public.chatbot_triggers;
CREATE POLICY service_role_all_chatbot_triggers
  ON public.chatbot_triggers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recreate public read policy explicitly to keep embed/runtime behaviour intact.
DROP POLICY IF EXISTS anon_read_active_chatbot_triggers ON public.chatbot_triggers;
CREATE POLICY anon_read_active_chatbot_triggers
  ON public.chatbot_triggers
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.chatbot_configs c
      JOIN public.tours t ON t.id = c.tour_id
      WHERE c.id = chatbot_triggers.chatbot_config_id
        AND c.is_active = true
        AND t.is_active = true
    )
  );

