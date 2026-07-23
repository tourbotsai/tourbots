-- 92_tour_menu_widget_defaults_and_rate_limit.sql
-- Two independent fixes bundled in one migration because they're both small and were
-- raised in the same review pass:
--
-- 1) The reopen-widget column defaults on tour_menu_settings (set back in
--    4_tour_menu_initial.sql) never agreed with the app's own defaults
--    (lib/tour-menu/index.ts WIDGET_DEFAULTS, added in this same change). A direct SQL
--    insert or a future bulk-admin tool that skips those columns would silently get a
--    red, bottom-right, pill-shaped button instead of the intended slate, top-left,
--    small one. This aligns the column defaults with WIDGET_DEFAULTS so every write path
--    — API route, direct insert, or otherwise — agrees.
--
-- 2) embed_menu_events had no ip_address column, so the public track-menu-event endpoint
--    had no way to apply a real per-IP rate limit (unlike the lead-capture form, which
--    already has this). Adds the column plus an index shaped for the rate-limit count
--    queries in lib/embed-menu-event-rate-limiter.ts.
--
-- Run after 91_tour_menu_style_simplify.sql.

-- ---------------------------------------------------------------------------
-- 1) Align tour_menu_settings widget column defaults with WIDGET_DEFAULTS.
--    Existing rows are untouched — this only changes what NEW rows get when a column
--    is omitted from the insert.
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  alter column widget_position set default 'top-left',
  alter column widget_icon set default 'Menu',
  alter column widget_size set default 'small',
  alter column widget_hover_color set default '#F0F0F0',
  alter column widget_icon_color set default '#0F172A',
  alter column widget_x_offset set default 16,
  alter column widget_y_offset set default 16,
  alter column widget_tooltip_text set default 'Open menu',
  alter column widget_border_radius set default 12;

-- ---------------------------------------------------------------------------
-- 2) Add ip_address to embed_menu_events for rate limiting.
-- ---------------------------------------------------------------------------
alter table public.embed_menu_events
  add column if not exists ip_address text;

create index if not exists idx_embed_menu_events_venue_ip_created
  on public.embed_menu_events (venue_id, ip_address, created_at desc);

-- Verification (run manually):
-- select column_default from information_schema.columns
--   where table_name = 'tour_menu_settings' and column_name = 'widget_icon_color';
-- select column_name from information_schema.columns
--   where table_name = 'embed_menu_events' and column_name = 'ip_address';
