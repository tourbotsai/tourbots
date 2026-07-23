-- 93_tour_menu_premium_chrome.sql
-- Premium chrome controls for the tour menu:
--   1) Align start_open column default with the app (hamburger pattern = closed)
--   2) Close-button size / position / colour / style
--   3) Global menu font family
--   4) Panel elevation (shadow)
--
-- Run after 92_tour_menu_widget_defaults_and_rate_limit.sql.
-- Existing rows are untouched except where noted; column defaults only affect
-- NEW inserts that omit these fields. The app writes explicit values on every save.

-- ---------------------------------------------------------------------------
-- 1) start_open should default to false (starts closed → hamburger trigger).
--    Migration 89 set this to true when the column was introduced.
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  alter column start_open set default false;

-- ---------------------------------------------------------------------------
-- 2) Close-button chrome
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  add column if not exists close_button_size text not null default 'medium';

alter table public.tour_menu_settings
  add column if not exists close_button_position text not null default 'top-right';

alter table public.tour_menu_settings
  add column if not exists close_button_color text not null default '#64748B';

alter table public.tour_menu_settings
  add column if not exists close_button_style text not null default 'ghost';

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_close_button_size;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_close_button_size
  check (close_button_size in ('small', 'medium', 'large'));

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_close_button_position;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_close_button_position
  check (close_button_position in ('top-right', 'top-left'));

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_close_button_style;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_close_button_style
  check (close_button_style in ('ghost', 'filled'));

-- ---------------------------------------------------------------------------
-- 3) Global typography + panel elevation
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  add column if not exists menu_font_family text not null default 'system';

alter table public.tour_menu_settings
  add column if not exists panel_shadow text not null default 'medium';

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_font_family;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_font_family
  check (
    menu_font_family in (
      'system',
      'dm-sans',
      'plus-jakarta',
      'source-sans',
      'libre-franklin',
      'playfair',
      'georgia'
    )
  );

alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_panel_shadow;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_panel_shadow
  check (panel_shadow in ('none', 'light', 'medium', 'heavy'));

-- Verification (run manually):
-- select column_default from information_schema.columns
--   where table_name = 'tour_menu_settings' and column_name = 'start_open';
-- select column_name from information_schema.columns
--   where table_name = 'tour_menu_settings'
--     and column_name in (
--       'close_button_size', 'close_button_position', 'close_button_color',
--       'close_button_style', 'menu_font_family', 'panel_shadow'
--     );
