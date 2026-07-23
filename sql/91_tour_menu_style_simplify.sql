-- 91_tour_menu_style_simplify.sql
-- Collapses the tour menu chrome model from three styles (modal / drawer / icon) down to
-- two (modal / drawer). "Icon" and "drawer" already rendered identically (both are the
-- side-panel chrome, gated by start_open) — the only real difference was cosmetic, so this
-- is a behaviour-preserving rename/backfill, not a functional change for existing menus.
--
-- Run after 90_embed_menu_events.sql.

-- ---------------------------------------------------------------------------
-- 1) Backfill: any menu using the old 'icon' style becomes 'drawer'.
-- ---------------------------------------------------------------------------
update public.tour_menu_settings
set menu_style = 'drawer'
where menu_style = 'icon';

-- ---------------------------------------------------------------------------
-- 2) Tighten the constraint + default to the two remaining styles.
-- ---------------------------------------------------------------------------
alter table public.tour_menu_settings
  drop constraint if exists chk_tour_menu_style;

alter table public.tour_menu_settings
  add constraint chk_tour_menu_style
  check (menu_style in ('modal', 'drawer'));

alter table public.tour_menu_settings
  alter column menu_style set default 'drawer';

-- ---------------------------------------------------------------------------
-- 3) avoid_chat_launcher is no longer an exposed setting (always applied by the
--    renderer) — leave the column in place for backward compatibility, just stop
--    relying on its value going forward. No schema change needed.
-- ---------------------------------------------------------------------------

-- Verification (run manually):
-- select distinct menu_style from public.tour_menu_settings;
-- select count(*) from public.tour_menu_settings where menu_style = 'icon'; -- expect 0
