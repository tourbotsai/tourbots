-- 44_tour_menu_padding_vertical.sql
-- Adds a vertical padding control to the Tour Menu container.
-- The existing `padding` column controls horizontal (left/right) padding;
-- `padding_vertical` controls top/bottom padding. Defaults to 0 to preserve
-- the current appearance of existing menus.
-- Run this after 4_tour_menu_initial.sql.

alter table public.tour_menu_settings
  add column if not exists padding_vertical integer not null default 0;
