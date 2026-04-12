-- 39_verify_rls_and_grants.sql
-- Verification queries for RLS/policy/grant hardening.

-- 1) RLS status for public schema tables.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2) Active policies on public schema tables.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Remaining table grants for anon/authenticated.
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 4) Remaining function EXECUTE grants for anon/authenticated.
SELECT
  routine_schema,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY routine_name, grantee;


-- Results:
/*
[
  {
    "schema_name": "public",
    "table_name": "agency_portal_login_attempts",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "agency_portal_sessions",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "agency_portal_settings",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "agency_portal_shares",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "agency_portal_users",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "billing_addons",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "billing_plans",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "blogs",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_configs",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_customisations",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_documents",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_hard_limit_usage",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_info_fields",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_info_sections",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "chatbot_triggers",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "conversations",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "embed_stats",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "guides",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "help_articles",
    "rls_enabled": false,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_lead_notes",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_leads",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_sequence_emails",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_sequence_enrollments",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_sequence_steps",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "platform_outbound_sequences",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "rate_limit_logs",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "support_conversations",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "support_messages",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "tour_menu_blocks",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "tour_menu_settings",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "tour_points",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "tours",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "user_venue_access",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "users",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "venue_billing_events",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "venue_billing_records",
    "rls_enabled": true,
    "rls_forced": false
  },
  {
    "schema_name": "public",
    "table_name": "venues",
    "rls_enabled": true,
    "rls_forced": false
  }
]

[
  {
    "schemaname": "public",
    "tablename": "agency_portal_login_attempts",
    "policyname": "service_role_all_agency_portal_login_attempts",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "agency_portal_sessions",
    "policyname": "service_role_all_agency_portal_sessions",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "agency_portal_settings",
    "policyname": "service_role_all_agency_portal_settings",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "agency_portal_shares",
    "policyname": "service_role_all_agency_portal_shares",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "agency_portal_users",
    "policyname": "service_role_all_agency_portal_users",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_configs",
    "policyname": "anon_read_active_chatbot_configs",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "((chatbot_type = 'tour'::text) AND (is_active = true) AND (EXISTS ( SELECT 1\n   FROM tours t\n  WHERE ((t.id = chatbot_configs.tour_id) AND (t.is_active = true)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_configs",
    "policyname": "service_role_all_chatbot_configs",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_customisations",
    "policyname": "anon_read_active_chatbot_customisations",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "((chatbot_type = 'tour'::text) AND (is_active = true) AND (EXISTS ( SELECT 1\n   FROM tours t\n  WHERE ((t.id = chatbot_customisations.tour_id) AND (t.is_active = true)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_customisations",
    "policyname": "service_role_all_chatbot_customisations",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_documents",
    "policyname": "service_role_all_chatbot_documents",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_hard_limit_usage",
    "policyname": "service_role_all_chatbot_hard_limit_usage",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_info_fields",
    "policyname": "anon_read_active_chatbot_info_fields",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM ((chatbot_info_sections s\n     JOIN chatbot_configs c ON ((c.id = s.chatbot_config_id)))\n     JOIN tours t ON ((t.id = c.tour_id)))\n  WHERE ((s.id = chatbot_info_fields.section_id) AND (s.is_active = true) AND (c.is_active = true) AND (t.is_active = true))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_info_fields",
    "policyname": "service_role_all_chatbot_info_fields",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_info_sections",
    "policyname": "anon_read_active_chatbot_info_sections",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "((is_active = true) AND (EXISTS ( SELECT 1\n   FROM (chatbot_configs c\n     JOIN tours t ON ((t.id = c.tour_id)))\n  WHERE ((c.id = chatbot_info_sections.chatbot_config_id) AND (c.is_active = true) AND (t.is_active = true)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_info_sections",
    "policyname": "service_role_all_chatbot_info_sections",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "chatbot_triggers",
    "policyname": "anon_read_active_chatbot_triggers",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "((is_active = true) AND (EXISTS ( SELECT 1\n   FROM (chatbot_configs c\n     JOIN tours t ON ((t.id = c.tour_id)))\n  WHERE ((c.id = chatbot_triggers.chatbot_config_id) AND (c.is_active = true) AND (t.is_active = true)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "conversations",
    "policyname": "service_role_all_conversations",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "embed_stats",
    "policyname": "service_role_all_embed_stats",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_lead_notes",
    "policyname": "service_role_all_platform_outbound_lead_notes",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_leads",
    "policyname": "service_role_all_platform_outbound_leads",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_sequence_emails",
    "policyname": "service_role_all_platform_outbound_sequence_emails",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_sequence_enrollments",
    "policyname": "service_role_all_platform_outbound_sequence_enrollments",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_sequence_steps",
    "policyname": "service_role_all_platform_outbound_sequence_steps",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "platform_outbound_sequences",
    "policyname": "service_role_all_platform_outbound_sequences",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "rate_limit_logs",
    "policyname": "service_role_all_rate_limit_logs",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "support_conversations",
    "policyname": "service_role_all_support_conversations",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "support_messages",
    "policyname": "service_role_all_support_messages",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tour_menu_blocks",
    "policyname": "anon_read_enabled_tour_menu_blocks",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (tour_menu_settings s\n     JOIN tours t ON ((t.id = s.tour_id)))\n  WHERE ((s.id = tour_menu_blocks.menu_id) AND (s.enabled = true) AND (t.is_active = true))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tour_menu_blocks",
    "policyname": "service_role_all_tour_menu_blocks",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tour_menu_settings",
    "policyname": "anon_read_enabled_tour_menu_settings",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "((enabled = true) AND (EXISTS ( SELECT 1\n   FROM tours t\n  WHERE ((t.id = tour_menu_settings.tour_id) AND (t.is_active = true)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tour_menu_settings",
    "policyname": "service_role_all_tour_menu_settings",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tour_points",
    "policyname": "anon_read_active_tour_points",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM tours t\n  WHERE ((t.id = tour_points.tour_id) AND (t.is_active = true))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tour_points",
    "policyname": "service_role_all_tour_points",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "tours",
    "policyname": "anon_read_active_tours",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "(is_active = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tours",
    "policyname": "service_role_all_tours",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "user_venue_access",
    "policyname": "service_role_all_user_venue_access",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "service_role_all_users",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "venue_billing_events",
    "policyname": "service_role_all_venue_billing_events",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "venue_billing_records",
    "policyname": "service_role_all_venue_billing_records",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "venues",
    "policyname": "service_role_all_venues",
    "permissive": "PERMISSIVE",
    "roles": "{service_role}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  }
]

[
  {
    "table_schema": "public",
    "table_name": "chatbot_configs",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_configs",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_customisations",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_customisations",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_info_fields",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_info_fields",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_info_sections",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_info_sections",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_triggers",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "chatbot_triggers",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_menu_blocks",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_menu_blocks",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_menu_settings",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_menu_settings",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_points",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tour_points",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tours",
    "grantee": "anon",
    "privilege_type": "SELECT"
  },
  {
    "table_schema": "public",
    "table_name": "tours",
    "grantee": "authenticated",
    "privilege_type": "SELECT"
  }
]



*/