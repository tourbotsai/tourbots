-- 37_enable_rls_tenant_sensitive_tables.sql
-- Enable RLS for tenant-sensitive tables and define least-privilege policies.

DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'users',
    'venues',
    'user_venue_access',
    'tours',
    'tour_points',
    'tour_menu_settings',
    'tour_menu_blocks',
    'chatbot_configs',
    'chatbot_info_sections',
    'chatbot_info_fields',
    'chatbot_triggers',
    'chatbot_documents',
    'chatbot_customisations',
    'chatbot_hard_limit_usage',
    'rate_limit_logs',
    'conversations',
    'embed_stats',
    'embed_tour_moves',
    'support_conversations',
    'support_messages',
    'venue_billing_records',
    'venue_billing_events',
    'agency_portal_settings',
    'agency_portal_shares',
    'agency_portal_users',
    'agency_portal_sessions',
    'agency_portal_login_attempts',
    'platform_outbound_leads',
    'platform_outbound_lead_notes',
    'platform_outbound_sequences',
    'platform_outbound_sequence_steps',
    'platform_outbound_sequence_enrollments',
    'platform_outbound_sequence_emails'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'service_role_all_' || tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        'service_role_all_' || tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Public embed read policies (read-only, active-scoped).
DROP POLICY IF EXISTS anon_read_active_tours ON public.tours;
CREATE POLICY anon_read_active_tours
  ON public.tours
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS anon_read_enabled_tour_menu_settings ON public.tour_menu_settings;
CREATE POLICY anon_read_enabled_tour_menu_settings
  ON public.tour_menu_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = tour_menu_settings.tour_id
        AND t.is_active = true
    )
  );

DROP POLICY IF EXISTS anon_read_enabled_tour_menu_blocks ON public.tour_menu_blocks;
CREATE POLICY anon_read_enabled_tour_menu_blocks
  ON public.tour_menu_blocks
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tour_menu_settings s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE s.id = tour_menu_blocks.menu_id
        AND s.enabled = true
        AND t.is_active = true
    )
  );

DROP POLICY IF EXISTS anon_read_active_tour_points ON public.tour_points;
CREATE POLICY anon_read_active_tour_points
  ON public.tour_points
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = tour_points.tour_id
        AND t.is_active = true
    )
  );

DROP POLICY IF EXISTS anon_read_active_chatbot_configs ON public.chatbot_configs;
CREATE POLICY anon_read_active_chatbot_configs
  ON public.chatbot_configs
  FOR SELECT
  TO anon, authenticated
  USING (
    chatbot_type = 'tour'
    AND is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = chatbot_configs.tour_id
        AND t.is_active = true
    )
  );

DROP POLICY IF EXISTS anon_read_active_chatbot_customisations ON public.chatbot_customisations;
CREATE POLICY anon_read_active_chatbot_customisations
  ON public.chatbot_customisations
  FOR SELECT
  TO anon, authenticated
  USING (
    chatbot_type = 'tour'
    AND is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.tours t
      WHERE t.id = chatbot_customisations.tour_id
        AND t.is_active = true
    )
  );

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

DROP POLICY IF EXISTS anon_read_active_chatbot_info_sections ON public.chatbot_info_sections;
CREATE POLICY anon_read_active_chatbot_info_sections
  ON public.chatbot_info_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.chatbot_configs c
      JOIN public.tours t ON t.id = c.tour_id
      WHERE c.id = chatbot_info_sections.chatbot_config_id
        AND c.is_active = true
        AND t.is_active = true
    )
  );

DROP POLICY IF EXISTS anon_read_active_chatbot_info_fields ON public.chatbot_info_fields;
CREATE POLICY anon_read_active_chatbot_info_fields
  ON public.chatbot_info_fields
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chatbot_info_sections s
      JOIN public.chatbot_configs c ON c.id = s.chatbot_config_id
      JOIN public.tours t ON t.id = c.tour_id
      WHERE s.id = chatbot_info_fields.section_id
        AND s.is_active = true
        AND c.is_active = true
        AND t.is_active = true
    )
  );
